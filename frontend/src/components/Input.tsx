import { useState, forwardRef } from 'react'
import { Eye, EyeOff, LucideIcon } from 'lucide-react'

interface InputProps {
  label?: string
  error?: string
  success?: string
  icon?: LucideIcon
  type?: string
  dir?: string
  className?: string
  containerClass?: string
  required?: boolean
  hint?: string
  size?: 'sm' | 'md' | 'lg'
  [key: string]: any
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  icon: Icon,
  type = 'text',
  dir,
  className = '',
  containerClass = '',
  required,
  hint,
  size = 'md',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const hasValue = props.value || props.defaultValue
  const isFloating = focused || hasValue
  const isPassword = type === 'password'

  const inputType = isPassword && showPassword ? 'text' : type
  const autoDir = dir || (type === 'tel' || type === 'number' ? 'ltr' : undefined)

  const sizeStyles: Record<string, string> = {
    sm: 'py-2 text-xs',
    md: 'py-3 text-sm',
    lg: 'py-3.5 text-base',
  }

  const iconSpacing = Icon ? 'pr-[48px]' : 'pr-4'
  const passwordSpacing = isPassword ? 'pl-[48px]' : 'pl-4'

  return (
    <div className={`relative ${containerClass}`}>
      {Icon && (
        <Icon
          size={18}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-[2] pointer-events-none transition-all duration-200 ${
            error ? 'text-rose-400' : isFloating ? 'text-brand-500' : 'text-surface-400'
          }`}
        />
      )}
      {label && (
        <label
          className={`absolute z-[1] pointer-events-none transition-all duration-200 ${
            Icon ? 'right-[48px]' : 'right-4'
          } ${
            isFloating
              ? `top-0 right-3 text-[11px] bg-white px-1 -translate-y-1/2 ${
                  error ? 'text-rose-500' : 'text-brand-500'
                }`
              : 'top-1/2 -translate-y-1/2 text-sm text-surface-400 font-medium bg-transparent px-0'
          }`}
        >
          {label}
          {required && <span className="text-rose-400 mr-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          dir={autoDir}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full border-2 rounded-xl bg-white text-surface-800 font-medium outline-none
            transition-all duration-200
            ${iconSpacing} ${passwordSpacing}
            ${sizeStyles[size] || sizeStyles.md}
            ${
              error
                ? 'border-rose-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                : success
                  ? 'border-success-200 focus:border-success-500 focus:ring-4 focus:ring-success-500/10'
                  : 'border-surface-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
            }
            ${props.readOnly ? 'bg-surface-50 cursor-default' : 'bg-white'}
            ${className}
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-surface-400 hover:text-surface-600 cursor-pointer p-1 z-[2] transition-colors rounded-lg hover:bg-surface-100"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        <span
          className={`
            absolute bottom-0 right-1/2 h-0.5 bg-brand-500 rounded-full transition-all duration-300 -translate-x-1/2
            ${focused ? 'w-3/4 opacity-100' : 'w-0 opacity-0'}
          `}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
            <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeOpacity="0.3" />
            <path d="M6 3.5v3M6 8v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
      {success && !error && (
        <p className="text-xs text-success-500 mt-1.5 pr-1 font-medium">{success}</p>
      )}
      {hint && !error && !success && (
        <p className="text-xs text-surface-400 mt-1.5 pr-1">{hint}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
