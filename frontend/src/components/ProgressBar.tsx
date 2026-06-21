interface ProgressBarProps {
  progress?: number
  label?: string
  showPercent?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ProgressBar({ progress = 0, label, showPercent = true, size = 'md' }: ProgressBarProps) {
  const heights: Record<string, string> = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }
  const clamped = Math.min(100, Math.max(0, progress))

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
          {showPercent && <span className="text-xs font-bold text-brand-500 ltr">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className="h-full bg-gradient-to-l from-brand-500 to-brand-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
