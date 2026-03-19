import { anthropic } from './client'

export interface ProposalCandidate {
  file: string
  line: number
  codeSnippet: string
  reason: string
  changeType: string
}

export interface GeneratedProposal {
  change_type: 'text' | 'condition' | 'validation' | 'display'
  difficulty: 1 | 2 | 3
  candidates: ProposalCandidate[]
}

export async function generateProposal(
  intent: string,
  fileContext: string
): Promise<GeneratedProposal> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an expert at guiding changes in Next.js / React apps.

For the user's change intent, identify up to 3 candidates for what file and where to change, explained clearly for beginners.

change_type values:
- "text": text/label change
- "condition": condition change
- "validation": add validation
- "display": display change

difficulty values: 1 (easy) / 2 (medium) / 3 (hard)

Output format (JSON only, no explanation or \`\`\` before/after):
{
  "change_type": "validation",
  "difficulty": 2,
  "candidates": [
    {
      "file": "components/AddTaskForm.tsx",
      "line": 18,
      "codeSnippet": "disabled={text.trim() === ''}",
      "reason": "Controlling button enabled/disabled state inside the UI component is the standard React pattern",
      "changeType": "Add validation"
    }
  ]
}

---
Change intent: ${intent}

Codebase (main files):
${fileContext}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    return JSON.parse(match[0]) as GeneratedProposal
  } catch {
    return {
      change_type: 'text',
      difficulty: 1,
      candidates: [],
    }
  }
}
