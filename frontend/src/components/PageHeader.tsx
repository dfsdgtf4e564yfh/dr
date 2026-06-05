import { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { StarDecoration } from './PersianDecoration'

interface PageHeaderProps {
  title: string
  children?: ReactNode
  showBack?: boolean
  backTo?: string
  gradient?: boolean
  icon?: React.ComponentType<any>
}

export default function PageHeader({ title, children, showBack = false, backTo, gradient = false, icon: Icon }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={24} className="text-brand-500" />}
          {showBack && (
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        )}
        <div className="relative">
          <h1 className={`text-xl font-extrabold ${gradient ? 'text-gradient' : 'text-slate-800'}`}>
            {title}
          </h1>
          <div className="h-0.5 w-12 bg-gradient-to-l from-brand-500 to-brand-300 rounded-full mt-1" />
        </div>
        <StarDecoration className="text-brand-300 hidden sm:block" />
      </div>
      {children && (
        <div className="flex gap-2 items-center">
          {children}
        </div>
      )}
    </div>
  )
}
