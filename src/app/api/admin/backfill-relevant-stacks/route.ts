import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'
import { extractJson } from '@/lib/anthropic/utils'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // relevant_stacks が空のプロジェクトを取得（スタックあり・ready のみ）
  const { data: projects } = await supabase
    .from('projects')
    .select('id, stack')
    .eq('user_id', user.id)
    .eq('status', 'ready')
    .neq('stack', '{}')

  if (!projects?.length) {
    return NextResponse.json({ updated: 0, message: 'No projects to update' })
  }

  let updatedUsecases = 0

  for (const project of projects) {
    const projectStack: string[] = project.stack ?? []
    if (projectStack.length === 0) continue

    // relevant_stacks が空の usecases を取得
    const { data: usecases } = await supabase
      .from('usecases')
      .select('id, name, description')
      .eq('project_id', project.id)
      .eq('relevant_stacks', '{}')

    if (!usecases?.length) continue

    // プロジェクト単位で1回のAPIコールでまとめて処理
    const usecaseList = usecases
      .map((uc, i) => `${i + 1}. "${uc.name}": ${uc.description}`)
      .join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `For each use case below, pick 1-2 stacks from [${projectStack.join(', ')}] that are most directly involved in implementing it. The relevant_stacks must be a subset of this list.

Output format (JSON only, no explanation):
{
  "results": [
    { "index": 1, "relevant_stacks": ["Next.js", "TypeScript"] },
    { "index": 2, "relevant_stacks": ["Prisma"] }
  ]
}

Use cases:
${usecaseList}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    let results: { index: number; relevant_stacks: string[] }[] = []
    try {
      results = extractJson<{ results: { index: number; relevant_stacks: string[] }[] }>(text).results ?? []
    } catch {
      console.error(`backfill-relevant-stacks: parse error for project ${project.id}`)
      continue
    }

    // 各usecase を UPDATE
    for (const result of results) {
      const uc = usecases[result.index - 1]
      if (!uc) continue
      // project.stack のサブセットだけを許可
      const filtered = result.relevant_stacks.filter(s => projectStack.includes(s))
      await supabase
        .from('usecases')
        .update({ relevant_stacks: filtered })
        .eq('id', uc.id)
      updatedUsecases++
    }
  }

  return NextResponse.json({ updatedUsecases, projects: projects.length })
}
