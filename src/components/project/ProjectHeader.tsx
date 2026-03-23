import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { StackBadge } from '@/components/stack/StackBadge'

export function ProjectHeader({
  projectId,
  title,
  stack,
  fileCount,
  description,
}: {
  projectId: string
  title: string
  stack: string[]
  fileCount: number | null
  description: string
}) {
  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-2 text-sm text-[var(--app-subtle)]">
        <Link href="/projects" className="text-[var(--app-muted)] transition hover:text-[var(--app-text)]">
          Projects
        </Link>
        <span>/</span>
        <span className="text-[var(--app-text)]">{title}</span>
      </nav>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="quiet-title">{title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {stack.map((item) => (
              <StackBadge key={item} label={item} />
            ))}
            {fileCount != null ? <span className="quiet-meta ml-1">{fileCount} files</span> : null}
          </div>
          <p className="quiet-body mt-4 max-w-2xl">{description}</p>
        </div>

        <Link
          href={`/projects/${projectId}/change`}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--app-brand)] px-5 text-sm font-medium text-white transition hover:bg-[var(--app-brand)]/92"
        >
          Find changes
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}
