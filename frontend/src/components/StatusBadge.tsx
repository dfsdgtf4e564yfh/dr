interface StatusBadgeProps {
  status: string
  label?: string
  dot?: boolean
  className?: string
}

const statusConfig: Record<string, { dot: string; label: string; classes: string; pulse?: boolean }> = {
  active:    { dot: 'bg-emerald-500', label: 'فعال',          classes: 'bg-emerald-50 text-emerald-700 border border-emerald-100', pulse: true },
  inactive:  { dot: 'bg-rose-400',    label: 'غیرفعال',       classes: 'bg-rose-50 text-rose-700 border border-rose-100' },
  pending:   { dot: 'bg-amber-500',   label: 'در انتظار',     classes: 'bg-amber-50 text-amber-700 border border-amber-100', pulse: true },
  cancelled: { dot: 'bg-slate-400',   label: 'لغو شده',       classes: 'bg-slate-50 text-slate-500 border border-slate-100' },
  completed: { dot: 'bg-emerald-500', label: 'تکمیل شده',     classes: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  scheduled: { dot: 'bg-blue-500',    label: 'نوبت داده شده', classes: 'bg-blue-50 text-blue-700 border border-blue-100' },
  rescheduled:{ dot: 'bg-violet-500', label: 'تغییر زمان',    classes: 'bg-violet-50 text-violet-700 border border-violet-100' },
  paid:      { dot: 'bg-emerald-500', label: 'پرداخت شده',    classes: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  unpaid:    { dot: 'bg-amber-500',   label: 'پرداخت نشده',   classes: 'bg-amber-50 text-amber-700 border border-amber-100', pulse: true },
  partial:   { dot: 'bg-orange-400',  label: 'پرداخت جزئی',   classes: 'bg-orange-50 text-orange-700 border border-orange-100', pulse: true },
}

export default function StatusBadge({ status, label, dot = true, className = '' }: StatusBadgeProps) {
  const cfg = statusConfig[status] || { dot: 'bg-slate-300', label: status, classes: 'bg-slate-50 text-slate-500 border border-slate-100' }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${cfg.classes} ${className}`}>
      {dot && (
        <span className={`relative flex w-1.5 h-1.5 rounded-full ${cfg.dot}`}>
          {cfg.pulse && (
            <span className={`absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-50 animate-ping`} />
          )}
        </span>
      )}
      {label || cfg.label}
    </span>
  )
}
