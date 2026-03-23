const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MAX_INTENT_LENGTH = 500
const MAX_ANSWER_TEXT_LENGTH = 2000
const MAX_SELECTED_FILES = 20
const MAX_PATH_LENGTH = 240

type ValidationOk<T> = { ok: true; value: T }
type ValidationError = { ok: false; error: string }

type ValidationResult<T> = ValidationOk<T> | ValidationError

export interface ChangeProposalInput {
  intent: string
}

export interface ChallengeSubmitInput {
  selectedFiles: string[]
  answerText: string
  usedHint: boolean
  selectedIndex?: number
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export function validateChangeProposalInput(body: unknown): ValidationResult<ChangeProposalInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'INVALID_BODY' }
  }

  const intent = typeof (body as { intent?: unknown }).intent === 'string'
    ? (body as { intent: string }).intent.trim()
    : ''

  if (!intent) {
    return { ok: false, error: 'MISSING_INTENT' }
  }

  if (intent.length > MAX_INTENT_LENGTH) {
    return { ok: false, error: 'INTENT_TOO_LONG' }
  }

  return { ok: true, value: { intent } }
}

export function validateChallengeSubmitInput(body: unknown): ValidationResult<ChallengeSubmitInput> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'INVALID_BODY' }
  }

  const selectedFilesRaw = (body as { selectedFiles?: unknown }).selectedFiles
  const answerTextRaw = (body as { answerText?: unknown }).answerText
  const usedHintRaw = (body as { usedHint?: unknown }).usedHint
  const selectedIndexRaw = (body as { selectedIndex?: unknown }).selectedIndex

  if (!Array.isArray(selectedFilesRaw)) {
    return { ok: false, error: 'INVALID_SELECTED_FILES' }
  }

  if (selectedFilesRaw.length > MAX_SELECTED_FILES) {
    return { ok: false, error: 'TOO_MANY_SELECTED_FILES' }
  }

  const selectedFiles: string[] = []
  for (const entry of selectedFilesRaw) {
    if (typeof entry !== 'string') {
      return { ok: false, error: 'INVALID_SELECTED_FILES' }
    }
    const trimmed = entry.trim()
    if (!trimmed || trimmed.length > MAX_PATH_LENGTH) {
      return { ok: false, error: 'INVALID_SELECTED_FILES' }
    }
    if (trimmed.includes('..') || trimmed.startsWith('/')) {
      return { ok: false, error: 'INVALID_SELECTED_FILES' }
    }
    selectedFiles.push(trimmed)
  }

  const answerText = typeof answerTextRaw === 'string' ? answerTextRaw.trim() : ''
  if (answerText.length > MAX_ANSWER_TEXT_LENGTH) {
    return { ok: false, error: 'ANSWER_TOO_LONG' }
  }

  if (typeof usedHintRaw !== 'boolean') {
    return { ok: false, error: 'INVALID_USED_HINT' }
  }

  if (selectedIndexRaw !== undefined && selectedIndexRaw !== null) {
    if (typeof selectedIndexRaw !== 'number') {
      return { ok: false, error: 'INVALID_SELECTED_INDEX' }
    }

    if (!Number.isInteger(selectedIndexRaw) || selectedIndexRaw < 0) {
      return { ok: false, error: 'INVALID_SELECTED_INDEX' }
    }
  }

  return {
    ok: true,
    value: {
      selectedFiles,
      answerText,
      usedHint: usedHintRaw,
      selectedIndex:
        selectedIndexRaw === undefined || selectedIndexRaw === null
          ? undefined
          : (selectedIndexRaw as number),
    },
  }
}
