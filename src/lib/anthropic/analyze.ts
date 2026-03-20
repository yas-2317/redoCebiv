import { anthropic } from './client'
import { extractJson } from './utils'

export interface ExtractedUsecase {
  name: string
  description: string
  category: 'auth' | 'content' | 'navigation' | 'settings' | 'social' | 'other'
  related_file_paths: string[]
  relevant_stacks: string[]
}

export interface ExtractedChallenge {
  title: string
  description: string
  type: 'text_change' | 'condition' | 'validation' | 'display'
  difficulty: 1 | 2 | 3 | 4 | 5
  format: 'file_selection' | 'code_choice'
  answer: {
    correct_files: string[]
    correct_code: string
    explanation: string
    change_type: string
    related_examples: string[]
    // code_choice (difficulty 4-5) のみ使用
    current_code?: string
    choices?: string[]
    correct_index?: number
  }
  hint: string
}

// Pass 1: 網羅性重視で全ページ・画面からユースケースを抽出（件数制限なし）
async function extractRawUsecases(fileContext: string, projectStack: string[]): Promise<ExtractedUsecase[]> {
  const appDescription = projectStack.length > 0 ? projectStack.join(' / ') : 'web application'
  const stackInstruction = projectStack.length > 0
    ? `\n- For each usecase, add "relevant_stacks": pick 1-2 stacks from [${projectStack.join(', ')}] that are most directly involved. Must be a subset of this list.`
    : '\n- Set "relevant_stacks" to []'

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an expert at analyzing ${appDescription} code. Read the following codebase and extract ALL use cases from the perspective of "what the user wants to do".

Rules:
- Express use cases as user action goals (in the form "do X")
- Only include UI-event-driven use cases (exclude internal processes only)
- Ensure coverage: include at least one use case from each distinct page or screen found in the codebase
- It is OK to include similar or overlapping items at this stage — deduplication happens later${stackInstruction}

Output format (JSON only, no explanation or \`\`\` before/after):
{
  "usecases": [
    {
      "name": "Add a task",
      "description": "User types text and clicks the Add button to add a task",
      "category": "content",
      "related_file_paths": ["components/AddTaskForm.tsx", "hooks/useTaskForm.ts"],
      "relevant_stacks": ["Next.js", "TypeScript"]
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
    console.error('extractRawUsecases: failed to parse response')
    return []
  }
}

// Pass 2: 重複排除・統合して最終リストを生成（上限30件）
async function deduplicateUsecases(raw: ExtractedUsecase[]): Promise<ExtractedUsecase[]> {
  if (raw.length === 0) return []

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `The following is a raw list of use cases extracted from an app. Deduplicate and merge any that represent the same user action, then return a clean final list of up to 30 items.

Rules:
- If two items represent the same user action (even if worded differently), keep only one — prefer the more descriptive version
- Maintain all fields (name, description, category, related_file_paths, relevant_stacks) from the original data
- Keep up to 30 items

Raw list:
${JSON.stringify(raw, null, 2)}

Output format (JSON only, no explanation or \`\`\` before/after):
{
  "usecases": [...]
}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    return extractJson<{ usecases: ExtractedUsecase[] }>(text).usecases ?? []
  } catch {
    console.error('deduplicateUsecases: failed to parse response, returning raw')
    return raw.slice(0, 30)
  }
}

export async function extractUsecases(fileContext: string, projectStack: string[] = []): Promise<ExtractedUsecase[]> {
  const raw = await extractRawUsecases(fileContext, projectStack)
  return deduplicateUsecases(raw)
}

export async function generateChallenges(
  fileContext: string,
  usecases: ExtractedUsecase[],
  projectStack: string[] = []
): Promise<ExtractedChallenge[]> {
  const appDescription = projectStack.length > 0 ? projectStack.join(' / ') : 'web application'
  const usecaseSummary = usecases
    .map((uc, i) => `${i + 1}. ${uc.name}: ${uc.description}`)
    .join('\n')

  const challengeCount = Math.max(8, Math.round(usecases.length * 0.75))
  const d1 = Math.round(challengeCount * 0.20)
  const d2 = Math.round(challengeCount * 0.25)
  const d3 = Math.round(challengeCount * 0.20)
  const d4 = Math.round(challengeCount * 0.20)
  const d5 = challengeCount - d1 - d2 - d3 - d4

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Generate ${challengeCount} mini coding challenges for beginners based on this ${appDescription} app.

Difficulty distribution (5 levels):
- difficulty 1 (file_selection, 1 file, file name gives it away): ${d1} challenges
- difficulty 2 (file_selection, 1 file, must follow data flow): ${d2} challenges
- difficulty 3 (file_selection, multiple files, cross-layer): ${d3} challenges
- difficulty 4 (code_choice, identify which code is the problem): ${d4} challenges
- difficulty 5 (code_choice, choose the correct fix): ${d5} challenges

For difficulty 1-3 use format "file_selection". For difficulty 4-5 use format "code_choice".

Output format (JSON only, no explanation or \`\`\` before/after):
{
  "challenges": [
    {
      "title": "Disable the add button when input is empty",
      "description": "Prevent the add button from being clickable when the input is empty",
      "type": "validation",
      "difficulty": 2,
      "format": "file_selection",
      "answer": {
        "correct_files": ["components/AddTaskForm.tsx"],
        "correct_code": "disabled={text.trim() === ''}",
        "explanation": "The button's disabled prop should check if the input is empty",
        "change_type": "Add validation",
        "related_examples": []
      },
      "hint": "Check the props of the button component"
    },
    {
      "title": "Find the broken disable logic",
      "description": "This button should be disabled when loading, but something is wrong. Which code is the problem?",
      "type": "condition",
      "difficulty": 4,
      "format": "code_choice",
      "answer": {
        "correct_files": ["components/SubmitButton.tsx"],
        "current_code": null,
        "choices": [
          "const label = isLoading ? 'Submitting...' : 'Submit'",
          "const disabled = isLoading",
          "onClick={() => handleSubmit(data)}",
          "type=\"submit\""
        ],
        "correct_index": 1,
        "correct_code": "const disabled = isLoading",
        "explanation": "The disabled logic only checks isLoading but should also check if input is empty",
        "change_type": "Fix condition",
        "related_examples": []
      },
      "hint": "Look for where the disabled state is defined"
    },
    {
      "title": "Fix the disable condition",
      "description": "The button should be disabled when loading OR when input is empty. Choose the correct code.",
      "type": "condition",
      "difficulty": 5,
      "format": "code_choice",
      "answer": {
        "correct_files": ["components/SubmitButton.tsx"],
        "current_code": "const disabled = isLoading",
        "choices": [
          "disabled={isLoading}",
          "disabled={isLoading || input.trim() === ''}",
          "disabled={!isLoading && input === ''}",
          "disabled={isLoading && input.trim() === ''}"
        ],
        "correct_index": 1,
        "correct_code": "disabled={isLoading || input.trim() === ''}",
        "explanation": "Both conditions must be checked with || so either one disables the button",
        "change_type": "Fix condition",
        "related_examples": []
      },
      "hint": "Think about what || vs && means for two conditions"
    }
  ]
}

Rules for code_choice:
- choices: exactly 4 options, randomly ordered (correct answer not always first)
- correct_index: 0-3 index of the correct choice
- Wrong choices must be plausible but subtly incorrect (wrong operator, missing edge case, inverted logic)
- difficulty 4: current_code is null, choices are snippets from the codebase — only one is the problematic piece
- difficulty 5: current_code is the "before" snippet, choices are candidate fixes

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
