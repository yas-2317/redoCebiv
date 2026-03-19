import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChangeIntentForm } from '@/components/change/ChangeIntentForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ChangePage({ params }: PageProps) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, status')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project || project.status !== 'ready') notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-6 text-sm text-gray-400">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-gray-600">
          {project.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Find changes</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">Find changes</h1>
      <p className="mb-6 text-sm text-gray-500">Describe what you want to change in plain English.</p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ChangeIntentForm projectId={projectId} />
      </div>
    </div>
  )
}
