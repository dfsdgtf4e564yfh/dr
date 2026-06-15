import { useState, useRef, useEffect } from 'react'

interface OtpInputProps {
  length?: number
  onComplete?: (code: string) => void
  disabled?: boolean
  error?: string
}

export default function OtpInput({ length = 6, onComplete, disabled = false, error = '' }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''))
  const [activeIndex, setActiveIndex] = useState(0)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (disabled) return
    if (value && !/^\d$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)
    if (value && index < length - 1) {
      setActiveIndex(index + 1)
      inputsRef.current[index + 1]?.focus()
    }
    const code = newDigits.join('')
    if (code.length === length && onComplete) {
      onComplete(code)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        setDigits(newDigits)
        setActiveIndex(index - 1)
        inputsRef.current[index - 1]?.focus()
      } else {
        const newDigits = [...digits]
        newDigits[index] = ''
        setDigits(newDigits)
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      setActiveIndex(index - 1)
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      setActiveIndex(index + 1)
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    const newDigits = [...digits]
    for (let i = 0; i < paste.length; i++) {
      newDigits[i] = paste[i]
    }
    setDigits(newDigits)
    const focusIndex = Math.min(paste.length, length - 1)
    setActiveIndex(focusIndex)
    inputsRef.current[focusIndex]?.focus()
    if (paste.length === length && onComplete) {
      onComplete(paste)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2.5" dir="ltr" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputsRef.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => setActiveIndex(index)}
            disabled={disabled}
            className={`w-12 h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all duration-200 ${
              error
                ? 'border-red-300 bg-red-50 text-red-600'
                : digit
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : activeIndex === index
                    ? 'border-brand-400 bg-white shadow-[0_0_0_3px_rgba(44,110,158,0.15)]'
                    : 'border-slate-200 bg-white text-slate-800'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ caretColor: digit ? 'transparent' : undefined }}
          />
        ))}
      </div>
      <div className="flex justify-center gap-2">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              digits[i]
                ? 'bg-brand-500 w-8'
                : activeIndex === i
                  ? 'bg-brand-300 w-6'
                  : 'bg-slate-200 w-4'
            }`}
          />
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-500 text-center font-medium">{error}</p>
      )}
    </div>
  )
}
