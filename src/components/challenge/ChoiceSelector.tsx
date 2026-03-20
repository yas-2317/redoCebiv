'use client'

interface ChoiceSelectorProps {
  choices: string[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  disabled?: boolean
  correctIndex?: number  // 採点後に正解を表示する場合
  revealAnswer?: boolean
}

export function ChoiceSelector({
  choices,
  selectedIndex,
  onSelect,
  disabled = false,
  correctIndex,
  revealAnswer = false,
}: ChoiceSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {choices.map((choice, i) => {
        const isSelected = selectedIndex === i
        const isCorrect = revealAnswer && correctIndex === i
        const isWrong = revealAnswer && isSelected && correctIndex !== i

        let borderColor = 'border-gray-200'
        let bgColor = 'bg-white'
        let textColor = 'text-gray-800'

        if (isCorrect) {
          borderColor = 'border-green-400'
          bgColor = 'bg-green-50'
          textColor = 'text-green-900'
        } else if (isWrong) {
          borderColor = 'border-red-300'
          bgColor = 'bg-red-50'
          textColor = 'text-red-900'
        } else if (isSelected) {
          borderColor = 'border-brand'
          bgColor = 'bg-brand-subtle'
          textColor = 'text-gray-900'
        }

        return (
          <button
            key={i}
            onClick={() => !disabled && onSelect(i)}
            disabled={disabled}
            className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-colors ${borderColor} ${bgColor} ${disabled ? 'cursor-default' : 'cursor-pointer hover:border-gray-300'}`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                isCorrect ? 'border-green-500 bg-green-500 text-white' :
                isWrong   ? 'border-red-400 bg-red-400 text-white' :
                isSelected ? 'border-brand bg-brand text-white' :
                'border-gray-300 text-gray-400'
              }`}>
                {isCorrect ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + i)}
              </span>
              <pre className={`flex-1 whitespace-pre-wrap break-all font-mono text-sm leading-relaxed ${textColor}`}>
                {choice}
              </pre>
            </div>
          </button>
        )
      })}
    </div>
  )
}
