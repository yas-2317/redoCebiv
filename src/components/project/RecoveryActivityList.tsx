import { ActivityList, type ActivityItem, SectionHeader } from '@/components/dashboard/primitives'

export function RecoveryActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <section>
      <SectionHeader
        title="Recent recovery in this project"
        description="Meaningful moments that show the codebase becoming more understandable."
      />
      <ActivityList
        items={items}
        empty={<p className="quiet-meta">No recovery events yet. Trace a feature or solve a challenge to start the record.</p>}
      />
    </section>
  )
}
