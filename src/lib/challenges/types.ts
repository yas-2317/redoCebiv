export type ChallengeFormat = 'file_selection' | 'code_choice'

export type ChallengeDifficulty = 1 | 2 | 3 | 4 | 5

export interface ChallengeAnswer {
  correct_files: string[]
  correct_code: string
  explanation: string
  change_type: string
  related_examples: string[]
  choices?: string[]
  correct_index?: number
  current_code?: string
}
