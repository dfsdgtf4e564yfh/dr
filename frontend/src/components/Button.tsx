import { forwardRef, useCallback, ReactNode } from 'react'
import { motion } from 'framer-motion'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'gradient' | 'gradientRose' | 'gradientSuccess' | 'gradientAmber' | 'outline' | 'outlineDanger' | 'outlineSuccess' | 'link'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type ButtonShape = 'rounded' | 'pill' | 'square'

interface ButtonProps {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  loading?: boolean
  icon?: React.ComponentType<{ size?: number }>
  iconOnly?: boolean
  className?: string
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  animated?: boolean
  [key: string]: any
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/20 hover:shadow-md hover:shadow-brand-500/30 btn-iranian',
  secondary: 'bg-surface-100 text-surface-600 hover:bg-surface-200 hover:text-surface-700',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/20 hover:shadow-md hover:shadow-rose-500/30',
  success: 'bg-success-500 text-white hover:bg-success-600 shadow-sm shadow-success-500/20 hover:shadow-md hover:shadow-success-500/30',
  ghost: 'text-surface-500 hover:bg-surface-100 hover:text-brand-500',
  gradient: 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-500/20 hover:shadow-lg hover:shadow-brand-500/30 hover:from-brand-600 hover:to-brand-700 btn-iranian',
  gradientRose: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30',
  gradientSuccess: 'bg-gradient-to-r from-success-500 to-emerald-500 text-white shadow-sm shadow-success-500/20 hover:shadow-lg hover:shadow-success-500/30',
  gradientAmber: 'bg-gradient-to-r from-warning-500 to-orange-500 text-white shadow-sm shadow-warning-500/20 hover:shadow-lg hover:shadow-warning-500/30',
  outline: 'border-2 border-brand-500 text-brand-500 hover:bg-brand-50 active:bg-brand-100',
  outlineDanger: 'border-2 border-rose-500 text-rose-500 hover:bg-rose-50 active:bg-rose-100',
  outlineSuccess: 'border-2 border-success-500 text-success-500 hover:bg-success-50 active:bg-success-100',
  link: 'text-brand-500 hover:text-brand-600 underline-offset-4 hover:underline bg-transparent p-0',
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[11px] rounded-lg gap-1',
  sm: 'px-3.5 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3 text-base rounded-xl gap-2.5',
  xl: 'px-9 py-4 text-lg rounded-2xl gap-3',
}

const shapeStyles: Record<ButtonShape, string> = {
  rounded: '',
  pill: '!rounded-full',
  square: '!rounded-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  loading = false,
  icon: Icon,
  iconOnly = false,
  className = '',
  disabled,
  onClick,
  type = 'button',
  animated = true,
  ...props
}, ref) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    const ripple = document.createElement('span')
    const rect = btn.getBoundingClientRect()
    const max = Math.max(rect.width, rect.height)
    Object.assign(ripple.style, {
      width: `${max}px`,
      height: `${max}px`,
      left: `${e.clientX - rect.left - max / 2}px`,
      top: `${e.clientY - rect.top - max / 2}px`,
      position: 'absolute',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.3)',
      pointerEvents: 'none',
      animation: 'ripple 0.6s ease-out',
    })
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
    onClick?.(e)
  }, [onClick])

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      whileHover={disabled || loading || !animated ? {} : { scale: 1.02 }}
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center font-medium relative overflow-hidden
        transition-all duration-200 select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant] || variantStyles.primary}
        ${sizeStyles[size] || sizeStyles.md}
        ${shapeStyles[shape] || shapeStyles.rounded}
        ${loading ? 'opacity-70 pointer-events-none' : ''}
        ${iconOnly ? '!p-0 aspect-square' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? <Icon size={size === 'xs' ? 14 : size === 'sm' ? 15 : size === 'lg' ? 18 : size === 'xl' ? 22 : 16} /> : null}
      {loading ? (children ? children : '') : iconOnly ? '' : children}
    </motion.button>
  )
})

Button.displayName = 'Button'
export default Button
