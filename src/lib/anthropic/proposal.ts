import { anthropic } from './client'
import { getStackPromptContext } from './stack-prompts'
import { extractJson } from './utils'

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
  fileContext: string,
  projectStack: string[] = []
): Promise<GeneratedProposal> {
  const stackContext = getStackPromptContext(projectStack)
  const example = stackContext.examples.proposalExample
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: `You are an expert at guiding code changes in ${stackContext.appDescription} for non-engineers.
Given a user's change intent and the project files, identify the best 1–3 candidate locations to make the change.
Be precise: point to the exact file and line, show the current code snippet, and explain clearly why that is the right place.
Prioritize the most direct location that a beginner could find and confidently edit.
${stackContext.proposalGuidance}`,
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
${example}

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
    return extractJson<GeneratedProposal>(text)
  } catch {
    console.error('generateProposal: failed to parse response')
    return {
      change_type: 'text',
      difficulty: 1,
      candidates: [],
    }
  }
}
