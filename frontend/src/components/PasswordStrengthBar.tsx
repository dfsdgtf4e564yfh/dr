interface StrengthResult {
  level: number
  label: string
  color: string
}

export function getPasswordStrength(password: string): StrengthResult {
  if (!password) return { level: 0, label: '', color: '' }

  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)
  const len = password.length

  const isRepetitive = /^(\d)\1{5,}$/.test(password) || /^([a-zA-Z])\1{5,}$/.test(password)
  const isSequential = /^123456|^abcdef|^qwerty/i.test(password)

  let score = 0
  if (len >= 6) score += 1
  if (len >= 8) score += 1
  if (len >= 10) score += 1
  if (hasLower && hasUpper) score += 1
  if (hasDigit) score += 1
  if (hasSymbol) score += 1

  if (isRepetitive || isSequential || len < 6) score = 0

  if (score <= 1) return { level: 1, label: 'ضعیف', color: 'bg-red-500' }
  if (score <= 3) return { level: 2, label: 'متوسط', color: 'bg-amber-500' }
  return { level: 3, label: 'قوی', color: 'bg-green-500' }
}

export default function PasswordStrengthBar({ password }: { password: string }) {
  const { level, label, color } = getPasswordStrength(password)
  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= level ? color : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs mt-1 font-medium ${level === 1 ? 'text-red-500' : level === 2 ? 'text-amber-500' : 'text-green-500'}`}>
        {label}
      </p>
    </div>
  )
}
