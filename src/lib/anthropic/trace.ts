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

export async function generateTrace(
  usecase: { name: string; description: string },
  fileContext: string
): Promise<GeneratedTrace> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert at analyzing Next.js / React app code and explaining it clearly to beginners.

Analyze the code related to the use case "${usecase.name}" and return:
1. Related files and the role of each file
2. Processing flow (input → branch → state update → display update)
3. A plain-English explanation written from the user's perspective.
   - Start from what the user originally wanted to achieve
   - Then explain how the AI answered with this code
   - Use this framing: "You wanted [X], so the AI built [Y] to make that happen."
   - Keep it conversational and simple — 2 to 3 sentences max

Output format (JSON only, no explanation or \`\`\` before/after):
{
  "related_files": [
    {"path": "components/AddTaskForm.tsx", "role": "UI and input management", "keyLines": [18, 24]}
  ],
  "flow": [
    {"step": 1, "label": "Input", "description": "User types text into the input field", "file": "components/AddTaskForm.tsx", "line": 18}
  ],
  "explanation": "You wanted users to be able to add tasks, so the AI built a form that captures input and updates the list on submit."
}

---
Use case: ${usecase.name}
Description: ${usecase.description}

Related files:
${fileContext}`,
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
          content: `Fix the following output to JSON format only. Remove any explanation and return only the JSON object:\n\n${text}`,
        },
      ],
    })
    const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
    const retryMatch = retryText.match(/\{[\s\S]*\}/)
    if (!retryMatch) throw new Error('Failed to parse trace response')
    return JSON.parse(retryMatch[0]) as GeneratedTrace
  }
}
