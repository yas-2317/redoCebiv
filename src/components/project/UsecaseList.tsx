import Link from 'next/link'

interface Usecase {
  id: string
  name: string
  description: string
  related_file_paths: string[]
  display_order: number
}

interface Props {
  projectId: string
  usecases: Usecase[]
}

export default function UsecaseList({ projectId, usecases }: Props) {
  if (usecases.length === 0) {
    return (
      <p className="text-sm text-gray-500">No use cases found.</p>
    )
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
      {usecases.map(uc => (
        <li key={uc.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{uc.name}</p>
            <p className="truncate text-sm text-gray-400">{uc.description}</p>
          </div>
          <Link
            href={`/projects/${projectId}/trace/${uc.id}`}
            className="ml-4 shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover transition-colors"
          >
            View trace
          </Link>
        </li>
      ))}
    </ul>
  )
}
