import { SurfaceCard } from '@/components/dashboard/primitives'

const steps = [
  'Trace a feature you have not fully taken back yet',
  'Explain the flow in your own words',
  'Validate it with a challenge',
]

export function LearningPathCard() {
  return (
    <SurfaceCard>
      <p className="quiet-eyebrow">Learning path</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">
        A small loop, repeated until the code feels like yours.
      </h3>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step} className="rounded-[18px] border border-[var(--app-border)] bg-white/76 p-4">
            <p className="quiet-meta">Step {index + 1}</p>
            <p className="mt-3 text-sm font-medium leading-6 text-[var(--app-text)]">{step}</p>
          </div>
        ))}
      </div>
    </SurfaceCard>
  )
}
