import { anthropic } from './client'

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
}

export interface GeneratedTrace {
  related_files: TraceRelatedFile[]
  flow: TraceFlowStep[]
  explanation: string
}

const SYSTEM_PROMPT = `You are an expert at reading Next.js / React source code and explaining it clearly to non-engineers.
When given a use case and project files, identify exactly which files implement it and walk through the flow step by step.
Focus only on files directly involved in the feature — skip unrelated utilities or config.
Keep language simple: the person reading this built the app with AI and should immediately recognize what you describe.`

export async function generateTrace(
  usecase: { name: string; description: string },
  fileContext: string
): Promise<GeneratedTrace> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
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
{
  "related_files": [
    {"path": "components/AddTaskForm.tsx", "role": "Form UI and input state", "keyLines": [18, 24]}
  ],
  "flow": [
    {"step": 1, "label": "Input", "description": "User types into the input field", "file": "components/AddTaskForm.tsx", "line": 18}
  ],
  "explanation": "You wanted users to add tasks, so the AI built a form that captures input and appends it to the list on submit."
}

Rules:
- related_files: 2–5 files directly involved in this feature only
- keyLines: the 1–3 most important line numbers to understand the feature
- flow: 3–6 steps tracing the user action from UI to state or data
- explanation: 2 sentences max, start with "You wanted..." in plain language`,
          },
        ],
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    return JSON.parse(match[0]) as GeneratedTrace
  } catch {
    const retry = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Fix the following output to valid JSON only. Return only the JSON object, no explanation:\n\n${text}`,
        },
      ],
    })
    const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
    const retryMatch = retryText.match(/\{[\s\S]*\}/)
    if (!retryMatch) throw new Error('Failed to parse trace response')
    return JSON.parse(retryMatch[0]) as GeneratedTrace
  }
}
