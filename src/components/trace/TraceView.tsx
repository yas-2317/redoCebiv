import { FlowStepper } from './FlowStepper'

interface RelatedFile {
  path: string
  role: string
  keyLines: number[]
}

interface FlowStep {
  step: number
  label: string
  description: string
  file: string
  line: number
  snippet?: string
}

interface TraceViewProps {
  name: string
  relatedFiles: RelatedFile[]
  flow: FlowStep[]
  explanation: string
  cached: boolean
}

export function TraceView({ name, relatedFiles, flow, explanation, cached }: TraceViewProps) {
  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
        {cached && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
            Cached
          </span>
        )}
      </div>

      {/* Working backwards */}
      <section>
        <div className="card">
          <div className="card-header">
            <span className="card-header-title">Working backwards</span>
          </div>
          <div className="card-body">
            <p className="text-sm leading-relaxed text-gray-700">{explanation}</p>
          </div>
        </div>
      </section>

      {/* 2列レイアウト: Related files (左) | Processing flow (右) */}
      <div className="flex gap-12 items-start">

        {/* Related files — 左 25% sticky */}
        <div className="w-1/3 shrink-0 sticky top-20">
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">Your idea lives in these files</span>
            </div>
            <div className="divide-y divide-gray-100">
              {relatedFiles.map((file, i) => (
                <div key={file.path} className="flex items-start gap-3 px-4 py-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-brand-subtle text-xs font-bold text-brand">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium text-gray-900">
                      {file.path.split('/').pop()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 leading-snug">{file.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Processing flow — 右 75% */}
        <div className="flex-1 min-w-0">
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">Processing flow</span>
            </div>
            <div className="card-body">
              <FlowStepper flow={flow} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
