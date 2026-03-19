import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, status, error_message, file_count, stack, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  return NextResponse.json(project)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 本人確認 + zip_storage_path 取得
  const { data: project } = await supabase
    .from('projects')
    .select('id, zip_storage_path')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  // zip が残っていれば Storage から削除
  if (project.zip_storage_path) {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await serviceClient.storage.from('project_zips').remove([project.zip_storage_path])
  }

  // projects 削除（FK CASCADE で関連データも全削除）
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: 'DELETE_FAILED' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
