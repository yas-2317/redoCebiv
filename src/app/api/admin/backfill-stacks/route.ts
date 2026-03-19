import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectStack } from '@/lib/zip'
import type { ExtractedFile } from '@/lib/zip'

// スタック判定に必要なファイル名パターン
const STACK_RELEVANT_FILES = [
  'package.json',
  'tsconfig.json',
  'pubspec.yaml',
  'requirements.txt',
  'pyproject.toml',
  'Gemfile',
  'Package.swift',
]

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // stack が空のプロジェクトを取得（自分のプロジェクトのみ）
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'ready')
    .eq('stack', '{}')

  if (!projects?.length) {
    return NextResponse.json({ updated: 0, message: 'No projects to update' })
  }

  let updated = 0
  for (const project of projects) {
    // 判定に必要なファイルだけ取得
    const { data: files } = await supabase
      .from('project_files')
      .select('path, content, language, size_bytes')
      .eq('project_id', project.id)
      .or(
        STACK_RELEVANT_FILES.map(f => `path.ilike.%${f}`).join(',') +
        ',path.ilike.%.swift'
      )

    if (!files?.length) continue

    const extractedFiles: ExtractedFile[] = files.map(f => ({
      path: f.path,
      content: f.content ?? '',
      language: f.language,
      sizeBytes: f.size_bytes ?? 0,
    }))

    const stack = detectStack(extractedFiles)
    if (stack.length === 0) continue

    await supabase
      .from('projects')
      .update({ stack })
      .eq('id', project.id)

    updated++
  }

  return NextResponse.json({ updated, total: projects.length })
}
