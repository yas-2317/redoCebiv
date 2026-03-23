import { anthropic } from './client'
import { getStackPromptContext } from './stack-prompts'
import { extractJson } from './utils'

export interface TraceRelatedFile {
  path: string
  role: string
  keyLines: number[]
}

export interface TraceFlowStep {
  step: number
  label: string
  description: string
  file: string
  line: number
  snippet: string
}

export interface GeneratedTrace {
  related_files: TraceRelatedFile[]
  flow: TraceFlowStep[]
  explanation: string
}

export async function generateTrace(
  usecase: { name: string; description: string },
  fileContext: string,
  projectStack: string[] = []
): Promise<GeneratedTrace> {
  const stackContext = getStackPromptContext(projectStack)
  const example = stackContext.examples.traceExample
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: `You are an expert at reading ${stackContext.appDescription} source code and explaining it clearly to non-engineers.
When given a use case and project files, identify exactly which files implement it and walk through the flow step by step.
Focus only on files directly involved in the feature and skip unrelated utilities or config.
Keep language simple: the person reading this built the app with AI and should immediately recognize what you describe.
${stackContext.traceGuidance}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Project files:\n${fileContext}`,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: `Trace the use case: "${usecase.name}"
${usecase.description ? `Description: ${usecase.description}` : ''}

Output JSON only, no explanation or \`\`\` wrapper:
${example}

Rules:
- related_files: 2–5 files directly involved in this feature only
- keyLines: the 1–3 most important line numbers to understand the feature
- flow: 3–6 steps tracing the user action from UI to state or data
- flow[].snippet: extract the 3–8 most relevant lines for that step as a code string (use \\n for newlines)
- explanation: 2 sentences max, start with "You wanted..." in plain language`,
          },
        ],
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    return extractJson<GeneratedTrace>(text)
  } catch {
    const retry = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Fix the following output to valid JSON only. Return only the JSON object, no explanation:\n\n${text}`,
        },
      ],
    })
    const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
    try {
      return extractJson<GeneratedTrace>(retryText)
    } catch {
      console.error('generateTrace: failed to parse response after retry')
      throw new Error('Failed to parse trace response')
    }
  }
}
