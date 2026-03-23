import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

type BaseItem = {
  icon: LucideIcon
  label: string
  value: number
  href?: string
}

type FootprintEntry =
  | ({ type: 'item' } & BaseItem)
  | ({ type: 'group'; parent: BaseItem; children: BaseItem[] })

export function FootprintList({ entries }: { entries: FootprintEntry[] }) {
  return (
    <div className="space-y-12">
      {entries.map((entry, index) => {
        if (entry.type === 'item') {
          return (
            <FootprintCard
              key={`${entry.label}-${index}`}
              icon={entry.icon}
              label={entry.label}
              value={entry.value}
              href={entry.href}
            />
          )
        }

        return (
          <FootprintGroupCard
            key={`${entry.parent.label}-${index}`}
            parent={entry.parent}
            detailItems={entry.children}
          />
        )
      })}
    </div>
  )
}

function FootprintGroupCard({
  parent,
  detailItems,
}: {
  parent: BaseItem
  detailItems: BaseItem[]
}) {
  const ParentIcon = parent.icon

  const content = (
    <div className="rounded-[18px] border border-[var(--app-border)] bg-white/76 px-5 py-5 transition hover:bg-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[var(--app-brand-soft)] p-2 text-[var(--app-brand)]">
            <ParentIcon className="size-4" />
          </span>
          <span className="text-2xl font-medium tracking-[-0.03em] text-[var(--app-text)]">{parent.label}</span>
        </div>
        <span className="text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">{parent.value}</span>
      </div>

      <div className="mt-3 ml-12 space-y-1.5">
        {detailItems.map((child) => (
          <div key={child.label} className="grid grid-cols-[auto_auto_auto_3ch] items-center gap-x-2 text-sm text-[var(--app-muted)]">
            <span className="text-[var(--app-subtle)]">-</span>
            <span className="min-w-[68px]">{child.label}</span>
            <span className="text-[var(--app-subtle)]">:</span>
            <span className="text-right font-medium text-[var(--app-text)]">{child.value}</span>
          </div>
        ))}
      </div>
    </div>
  )

  if (parent.href) {
    return <Link href={parent.href} className="block">{content}</Link>
  }

  return content
}

function FootprintCard({
  icon: Icon,
  label,
  value,
  href,
}: BaseItem) {
  const content = (
    <div className="rounded-[18px] border border-[var(--app-border)] bg-white/76 px-5 py-5 transition hover:bg-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[var(--app-brand-soft)] p-2 text-[var(--app-brand)]">
            <Icon className="size-4" />
          </span>
          <span className="text-2xl font-medium tracking-[-0.03em] text-[var(--app-text)]">{label}</span>
        </div>
        <span className="text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">{value}</span>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }

  return content
}
