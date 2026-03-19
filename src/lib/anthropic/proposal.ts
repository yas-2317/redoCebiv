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

const SYSTEM_PROMPT = `You are an expert at guiding code changes in Next.js / React apps for non-engineers.
Given a user's change intent and the project files, identify the best 1–3 candidate locations to make the change.
Be precise: point to the exact file and line, show the current code snippet, and explain clearly why that is the right place.
Prioritize the most direct location — the one a beginner could find and confidently edit.`

export async function generateProposal(
  intent: string,
  fileContext: string
): Promise<GeneratedProposal> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
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
            text: `Change intent: ${intent}

Output JSON only, no explanation or \`\`\` wrapper:
{
  "change_type": "validation",
  "difficulty": 2,
  "candidates": [
    {
      "file": "components/AddTaskForm.tsx",
      "line": 18,
      "codeSnippet": "disabled={text.trim() === ''}",
      "reason": "This line directly controls the button state in the UI — the most straightforward place to adjust input validation",
      "changeType": "Add validation"
    }
  ]
}

change_type: "text" | "condition" | "validation" | "display"
difficulty: 1 (single line, easy) | 2 (logic change, moderate) | 3 (multiple files, hard)
candidates: 1–3 locations ordered from most to least recommended`,
          },
        ],
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
