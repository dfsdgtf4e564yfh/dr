import { ReactNode, ComponentType } from 'react'
import { motion } from 'framer-motion'
import { Inbox, Users, Calendar, DollarSign, FileText, Search, LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon | ComponentType<any>
  title?: string
  description?: string
  action?: ReactNode
  variant?: string
}

const illustrations: Record<string, JSX.Element> = {
  default: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <rect x="10" y="30" width="100" height="70" rx="12" fill="#eff6ff" />
      <rect x="25" y="45" width="70" height="6" rx="3" fill="#dbeafe" />
      <rect x="25" y="58" width="50" height="6" rx="3" fill="#dbeafe" />
      <rect x="25" y="71" width="60" height="6" rx="3" fill="#dbeafe" />
      <circle cx="60" cy="90" r="10" fill="#93c5fd" opacity="0.3" />
      <path d="M55 90l3.5 3.5 6-6.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  patients: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="45" cy="35" r="15" fill="#eff6ff" />
      <circle cx="45" cy="35" r="10" fill="#dbeafe" />
      <circle cx="45" cy="35" r="6" fill="#2563eb" opacity="0.3" />
      <rect x="25" y="55" width="40" height="10" rx="5" fill="#eff6ff" />
      <rect x="30" y="58" width="30" height="4" rx="2" fill="#dbeafe" />
      <circle cx="80" cy="40" r="12" fill="#f0fdf4" />
      <circle cx="80" cy="40" r="8" fill="#bbf7d0" />
      <rect x="68" y="55" width="24" height="6" rx="3" fill="#f0fdf4" />
      <path d="M20 85h80v25H20z" rx="10" fill="#eff6ff" />
      <path d="M30 95h60v8H30z" fill="#dbeafe" />
    </svg>
  ),
  calendar: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <rect x="20" y="20" width="80" height="80" rx="12" fill="#eff6ff" />
      <rect x="20" y="20" width="80" height="25" rx="12" fill="#2563eb" />
      <rect x="28" y="28" width="8" height="8" rx="2" fill="white" opacity="0.3" />
      <rect x="40" y="28" width="8" height="8" rx="2" fill="white" opacity="0.3" />
      <rect x="52" y="28" width="8" height="8" rx="2" fill="white" opacity="0.3" />
      <text x="60" y="65" textAnchor="middle" fill="#2563eb" fontSize="20" fontWeight="bold" fontFamily="Vazirmatn">۲۵</text>
      <text x="60" y="82" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="Vazirmatn">اسفند</text>
    </svg>
  ),
  search: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="50" cy="50" r="28" stroke="#dbeafe" strokeWidth="4" />
      <circle cx="50" cy="50" r="20" stroke="#2563eb" strokeWidth="3" opacity="0.4" />
      <circle cx="47" cy="47" r="4" fill="#2563eb" opacity="0.6" />
      <line x1="70" y1="70" x2="88" y2="88" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      <rect x="40" y="95" width="40" height="6" rx="3" fill="#eff6ff" />
       <rect x="45" y="108" width="30" height="4" rx="2" fill="#dbeafe" />
    </svg>
  ),
}

const iconMap: Record<string, LucideIcon> = {
  Default: Inbox,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Search,
}

export default function EmptyState({ icon: Icon, title = 'داده‌ای وجود ندارد', description, action, variant }: EmptyStateProps) {
  const SvgIllustration = illustrations[variant] || illustrations.default
  const FallbackIcon = iconMap[(Icon as any)?.name] || Icon || Inbox

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-14 px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-5"
      >
        {variant ? (
          <div className="opacity-80">{SvgIllustration}</div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            <FallbackIcon size={40} className="text-slate-300" />
          </div>
        )}
      </motion.div>
      <h4 className="text-sm font-bold text-slate-500 mb-1.5">{title}</h4>
      {description && <p className="text-xs text-slate-400 mb-5 text-center max-w-xs leading-relaxed">{description}</p>}
      {action && <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>{action}</motion.div>}
    </motion.div>
  )
}
