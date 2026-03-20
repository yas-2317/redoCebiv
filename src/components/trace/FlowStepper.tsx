interface FlowStep {
  step: number
  label: string
  description: string
  file: string
  line: number
  snippet?: string
}

interface FlowStepperProps {
  flow: FlowStep[]
}

export function FlowStepper({ flow }: FlowStepperProps) {
  return (
    <div className="space-y-1">
      {flow.map((step, i) => (
        <div key={step.step} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {step.step}
            </div>
            {i < flow.length - 1 && (
              <div className="mt-1 h-full min-h-4 w-px bg-gray-200" />
            )}
          </div>
          <div className="w-full pb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand">
              {step.label}
            </span>
            <p className="text-sm text-gray-700">{step.description}</p>
            <p className="mt-0.5 text-xs text-gray-600">
              {step.file}
              {step.line > 0 && ` · line ${step.line}`}
            </p>
            {step.snippet && (
              <pre className="mt-2 w-full overflow-x-hidden whitespace-pre-wrap break-words rounded-lg bg-gray-950 px-4 py-3 text-xs leading-relaxed text-gray-100">
                <code>{step.snippet}</code>
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
