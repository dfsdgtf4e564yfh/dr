interface StatusBadgeProps {
  status: string
  label?: string
  dot?: boolean
  className?: string
}

const statusConfig: Record<string, { dot: string; label: string; classes: string }> = {
  active: { dot: 'bg-emerald-500', label: 'فعال', classes: 'bg-emerald-50 text-emerald-600' },
  inactive: { dot: 'bg-red-500', label: 'غیرفعال', classes: 'bg-red-50 text-red-600' },
  pending: { dot: 'bg-amber-500', label: 'در انتظار', classes: 'bg-amber-50 text-amber-600' },
  cancelled: { dot: 'bg-slate-400', label: 'لغو شده', classes: 'bg-slate-50 text-slate-500' },
  completed: { dot: 'bg-emerald-500', label: 'تکمیل شده', classes: 'bg-emerald-50 text-emerald-600' },
  scheduled: { dot: 'bg-blue-500', label: 'نوبت داده شده', classes: 'bg-blue-50 text-blue-600' },
  paid: { dot: 'bg-emerald-500', label: 'پرداخت شده', classes: 'bg-emerald-50 text-emerald-600' },
  unpaid: { dot: 'bg-amber-500', label: 'پرداخت نشده', classes: 'bg-amber-50 text-amber-600' },
  partial: { dot: 'bg-amber-500', label: 'پرداخت جزئی', classes: 'bg-amber-50 text-amber-600' },
}

export default function StatusBadge({ status, label, dot = true, className = '' }: StatusBadgeProps) {
  const cfg = statusConfig[status] || { dot: 'bg-slate-300', label: status, classes: 'bg-slate-50 text-slate-500' }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.classes} ${className}`}>
      {dot && <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
      {label || cfg.label}
    </span>
  )
}
