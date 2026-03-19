import { anthropic } from './client'

export async function generateExplanation(params: {
  title: string
  grade: 'self' | 'with_hint' | 'missed'
  selectedFiles: string[]
  correctFiles: string[]
  answerText: string
  correctCode: string
}): Promise<string> {
  const { title, grade, selectedFiles, correctFiles, answerText, correctCode } = params

  const gradeContext =
    grade === 'self'
      ? 'The user identified the correct file without hints. Congratulate them briefly.'
      : grade === 'with_hint'
        ? 'The user identified the correct file but needed a hint.'
        : `The user selected [${selectedFiles.join(', ')}] but the correct file(s) are [${correctFiles.join(', ')}]. Guide them gently.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Challenge: "${title}"
Grade: ${grade}
${gradeContext}

User's answer: "${answerText || '(no answer provided)'}"
Correct change: "${correctCode}"

Write a 2-3 sentence explanation:
1. Why that file/location is the right place to make the change
2. If grade=missed, a gentle hint about what to look for next time
3. A brief mention of the React/Next.js pattern involved

Plain text only, no markdown.`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text.trim() : ''
}
