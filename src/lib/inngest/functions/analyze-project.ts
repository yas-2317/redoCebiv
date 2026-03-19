import { inngest } from '@/lib/inngest/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { extractZip, selectFilesForAnalysis, buildFileContext } from '@/lib/zip'
import { extractUsecases, generateChallenges } from '@/lib/anthropic/analyze'

// Inngestジョブ内ではサービスロールクライアントを使う（cookiesが使えないため）
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const analyzeProject = inngest.createFunction(
  {
    id: 'analyze-project',
    retries: 3,
    triggers: [{ event: 'project/analyze' }],
  },
  async ({ event, step }) => {
    const { projectId } = event.data as { projectId: string }
    const supabase = createServiceClient()

    // Step 1: ZIPダウンロード + ハッシュ計算
    const { files, hash } = await step.run('download-and-extract-zip', async () => {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('zip_storage_path, user_id')
        .eq('id', projectId)
        .single()

      if (projectError || !project?.zip_storage_path) {
        throw new Error(`Project not found or zip_storage_path missing: ${projectId}`)
      }

      const { data: zipData, error: downloadError } = await supabase.storage
        .from('project_zips')
        .download(project.zip_storage_path)

      if (downloadError || !zipData) {
        throw new Error(`Failed to download ZIP: ${downloadError?.message}`)
      }

      const buffer = Buffer.from(await zipData.arrayBuffer())
      return extractZip(buffer)
    })

    // Step 2: ハッシュ保存 + project_files INSERT
    await step.run('save-files', async () => {
      // zip_hash を保存
      await supabase
        .from('projects')
        .update({ zip_hash: hash, file_count: files.length })
        .eq('id', projectId)

      // project_files をバッチINSERT（100件ずつ）
      const BATCH = 100
      for (let i = 0; i < files.length; i += BATCH) {
        const batch = files.slice(i, i + BATCH).map(f => ({
          project_id: projectId,
          path: f.path,
          content: f.content,
          language: f.language,
          size_bytes: f.sizeBytes,
        }))
        const { error } = await supabase.from('project_files').upsert(batch, { onConflict: 'project_id,path' })
        if (error) throw new Error(`project_files insert error: ${error.message}`)
      }
    })

    // Step 3: ユースケース抽出（Claude Sonnet）
    const usecases = await step.run('extract-usecases', async () => {
      const selectedFiles = selectFilesForAnalysis(files, 60_000)
      const fileContext = buildFileContext(selectedFiles)
      return extractUsecases(fileContext)
    })

    // Step 4: usecases INSERT
    await step.run('save-usecases', async () => {
      const rows = usecases.map((uc, i) => ({
        project_id: projectId,
        name: uc.name,
        description: uc.description,
        category: uc.category ?? 'other',
        related_file_paths: uc.related_file_paths,
        display_order: i,
      }))
      const { error } = await supabase.from('usecases').insert(rows)
      if (error) throw new Error(`usecases insert error: ${error.message}`)
      return rows
    })

    // Step 5: 課題生成（Claude Haiku）
    await step.run('generate-challenges', async () => {
      const selectedFiles = selectFilesForAnalysis(files, 40_000)
      const fileContext = buildFileContext(selectedFiles)
      const challenges = await generateChallenges(fileContext, usecases)

      const VALID_TYPES = new Set(['text_change', 'condition', 'validation', 'display'])
      const normalizeType = (t: string): string => {
        if (VALID_TYPES.has(t)) return t
        if (t.includes('text')) return 'text_change'
        if (t.includes('valid')) return 'validation'
        if (t.includes('condition') || t.includes('logic')) return 'condition'
        return 'display'
      }

      if (challenges.length > 0) {
        const rows = challenges.map(ch => ({
          project_id: projectId,
          title: ch.title,
          description: ch.description,
          type: normalizeType(ch.type),
          difficulty: ch.difficulty,
          answer: ch.answer,
          hint: ch.hint,
        }))
        const { error } = await supabase.from('challenges').insert(rows)
        if (error) throw new Error(`challenges insert error: ${error.message}`)
      }
    })

    // Step 6: 完了処理（ZIPをStorageから削除してstatus=ready）
    await step.run('finalize', async () => {
      const { data: project } = await supabase
        .from('projects')
        .select('zip_storage_path')
        .eq('id', projectId)
        .single()

      if (project?.zip_storage_path) {
        await supabase.storage
          .from('project_zips')
          .remove([project.zip_storage_path])
      }

      await supabase
        .from('projects')
        .update({
          status: 'ready',
          zip_storage_path: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
    })
  }
)

// エラー時のハンドラ（Inngestの自動リトライ後も失敗した場合）
export const analyzeProjectOnFailure = inngest.createFunction(
  {
    id: 'analyze-project-on-failure',
    triggers: [{ event: 'inngest/function.failed' }],
  },
  async ({ event }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const failedEvent = event.data as any
    if (failedEvent?.function_id !== 'analyze-project') return

    const projectId = failedEvent?.event?.data?.projectId as string | undefined
    if (!projectId) return

    const supabase = createServiceClient()
    await supabase
      .from('projects')
      .update({
        status: 'error',
        error_message: 'Analysis failed. Please check your ZIP contents and try again.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
  }
)
