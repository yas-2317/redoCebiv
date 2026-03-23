import { anthropic } from './client'
import { getStackPromptContext } from './stack-prompts'

export async function generateExplanation(params: {
  title: string
  grade: 'self' | 'with_hint' | 'missed'
  format?: 'file_selection' | 'code_choice'
  selectedFiles: string[]
  correctFiles: string[]
  answerText: string
  correctCode: string
  selectedIndex?: number
  correctIndex?: number
  choices?: string[]
  currentCode?: string
  projectStack?: string[]
}): Promise<string> {
  const {
    title,
    grade,
    format = 'file_selection',
    selectedFiles,
    correctFiles,
    answerText,
    correctCode,
    selectedIndex,
    correctIndex,
    choices = [],
    currentCode,
    projectStack = [],
  } = params
  const stackContext = getStackPromptContext(projectStack)

  const gradeContext = format === 'code_choice'
    ? (
      grade === 'self'
        ? 'The user selected the correct code option without hints. Congratulate them briefly.'
        : grade === 'with_hint'
          ? 'The user selected the correct code option but needed a hint.'
          : `The user selected option ${selectedIndex ?? '(none)'} but the correct option is ${correctIndex ?? '(unknown)'}. Guide them gently toward the right pattern.`
    )
    : (
      grade === 'self'
        ? 'The user identified the correct file without hints. Congratulate them briefly.'
        : grade === 'with_hint'
          ? 'The user identified the correct file but needed a hint.'
          : `The user selected [${selectedFiles.join(', ')}] but the correct file(s) are [${correctFiles.join(', ')}]. Guide them gently.`
    )

  const answerContext = format === 'code_choice'
    ? `Current code:
${currentCode || '(not provided)'}

Choices:
${choices.map((choice, index) => `${index}: ${choice}`).join('\n') || '(no choices provided)'}

Selected option: ${selectedIndex ?? '(none)'}
Correct option: ${correctIndex ?? '(unknown)'}`
    : `User's answer: "${answerText || '(no answer provided)'}"`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Challenge: "${title}"
Grade: ${grade}
${gradeContext}

${answerContext}
Correct change: "${correctCode}"

Write a 2-3 sentence explanation:
1. Why that ${format === 'code_choice' ? 'choice/location in the code' : 'file/location'} is the right place to make the change
2. If grade=missed, a gentle hint about what to look for next time
3. A brief mention of the ${stackContext.gradingPatternLabel}

Plain text only, no markdown.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text.trim() : ''
}
