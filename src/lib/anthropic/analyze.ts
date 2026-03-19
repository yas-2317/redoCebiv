import { anthropic } from './client'
import { extractJson } from './utils'

export interface ExtractedUsecase {
  name: string
  description: string
  category: 'auth' | 'content' | 'navigation' | 'settings' | 'social' | 'other'
  related_file_paths: string[]
}

export interface ExtractedChallenge {
  title: string
  description: string
  type: 'text_change' | 'condition' | 'validation' | 'display'
  difficulty: 1 | 2 | 3
  answer: {
    correct_files: string[]
    correct_code: string
    explanation: string
    change_type: string
    related_examples: string[]
  }
  hint: string
}

export async function extractUsecases(fileContext: string): Promise<ExtractedUsecase[]> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are an expert at analyzing Next.js / React application code. Read the following codebase and extract use cases from the perspective of "what the user wants to do".

Rules:
- Express use cases as user action goals (in the form "do X")
- Only include UI-event-driven use cases (exclude internal processes only)
- Avoid duplicates
- Extract up to 20 use cases
- Choose use cases from as many different pages, screens, and components as possible (don't focus on one screen)

Output format (JSON only, no explanation or \`\`\` before/after):
{
  "usecases": [
    {
      "name": "Add a task",
      "description": "User types text and clicks the Add button to add a task",
      "category": "content",
      "related_file_paths": ["components/AddTaskForm.tsx", "hooks/useTaskForm.ts"]
    }
  ]
}

Category values (pick the closest one):
- auth: sign in, sign up, sign out, password reset, account management
- content: create, edit, delete, submit content items (posts, tasks, notes, products, etc.)
- navigation: browse, search, filter, sort, paginate, view lists or detail pages
- settings: profile editing, preferences, notifications, configuration
- social: like, comment, follow, share, reactions
- other: anything that doesn't fit the above

---
Codebase:
${fileContext}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    return extractJson<{ usecases: ExtractedUsecase[] }>(text).usecases ?? []
  } catch {
    const retry = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Fix the following output to JSON format only. Return only the JSON object:\n\n${text}`,
        },
      ],
    })
    const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
    try {
      return extractJson<{ usecases: ExtractedUsecase[] }>(retryText).usecases ?? []
    } catch {
      console.error('extractUsecases: failed to parse response after retry')
      return []
    }
  }
}

export async function generateChallenges(
  fileContext: string,
  usecases: ExtractedUsecase[]
): Promise<ExtractedChallenge[]> {
  const usecaseSummary = usecases
    .map((uc, i) => `${i + 1}. ${uc.name}: ${uc.description}`)
    .join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Generate 8 mini coding challenges for beginners based on this Next.js / React app.

Difficulty distribution:
- difficulty 1 (text/display change): 3 challenges
- difficulty 2 (condition/validation): 4 challenges
- difficulty 3 (multiple changes): 1 challenge

Output format (JSON only, no explanation or \`\`\` before/after):
{
  "challenges": [
    {
      "title": "Disable the add button",
      "description": "Prevent the add button from being clickable when the input is empty",
      "type": "validation",
      "difficulty": 2,
      "answer": {
        "correct_files": ["components/AddTaskForm.tsx"],
        "correct_code": "disabled={text.trim() === ''}",
        "explanation": "...",
        "change_type": "Add validation",
        "related_examples": []
      },
      "hint": "Check the props of the button component"
    }
  ]
}

---
Use cases:
${usecaseSummary}

Codebase (main files):
${fileContext}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    return extractJson<{ challenges: ExtractedChallenge[] }>(text).challenges ?? []
  } catch {
    console.error('generateChallenges: failed to parse response')
    return []
  }
}
