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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
        {cached && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
            Cached
          </span>
        )}
      </div>

      {/* 関連ファイル */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
          Your idea became these files:
        </h3>
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
          {relatedFiles.map((file, i) => (
            <div key={file.path} className="flex items-start gap-3 px-4 py-3.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-brand-subtle text-xs font-bold text-brand">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium text-gray-900">
                  {file.path}
                </p>
                <p className="text-sm text-gray-500">{file.role}</p>
                {file.keyLines.length > 0 && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    Key lines: {file.keyLines.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 処理フロー */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
          Processing flow
        </h3>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <FlowStepper flow={flow} />
        </div>
      </section>

      {/* やさしい説明 */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
          Working backwards:
        </h3>
        <div className="rounded-xl border border-brand-subtle bg-brand-subtle px-4 py-4">
          <p className="text-sm leading-relaxed text-gray-700">{explanation}</p>
        </div>
      </section>
    </div>
  )
}
