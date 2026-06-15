import { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  children?: ReactNode
  showBack?: boolean
  backTo?: string
  gradient?: boolean
  icon?: React.ComponentType<any>
}

/* نقش تزئینی هشت‌ضلعی ایرانی — SVG کوچک */
function IranianOrnament({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 1L12.5 4.5H16.5L14 8L16.5 11.5H12.5L10 15L7.5 11.5H3.5L6 8L3.5 4.5H7.5L10 1Z"
        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" opacity="0.5"
      />
      <circle cx="10" cy="8" r="1.5" fill="currentColor" opacity="0.35" />
    </svg>
  )
}

export default function PageHeader({ title, children, showBack = false, backTo, gradient = false, icon: Icon }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-6 relative">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        )}
        <div className="relative flex items-center gap-2">
          {Icon && (
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{background: 'linear-gradient(135deg, rgba(26,74,138,0.1), rgba(42,179,184,0.08))'}}
            >
              <Icon size={18} className="text-brand-600" />
            </span>
          )}
          <div>
            <h1 className={`text-xl font-extrabold leading-tight ${gradient ? 'text-gradient' : 'text-slate-800'}`}>
              {title}
            </h1>
            {/* خط تزئینی ایرانی زیر عنوان */}
            <div className="flex items-center gap-1 mt-0.5">
              <div style={{
                height: 2, width: 28, borderRadius: 2,
                background: 'linear-gradient(90deg, var(--persian-lajvard), var(--persian-firuzeh))'
              }} />
              <div style={{
                height: 2, width: 8, borderRadius: 2,
                background: 'linear-gradient(90deg, var(--persian-firuzeh), var(--persian-zafaran))',
                opacity: 0.6
              }} />
              <div style={{
                height: 2, width: 4, borderRadius: 2,
                background: 'var(--persian-zafaran)',
                opacity: 0.35
              }} />
            </div>
          </div>
          <IranianOrnament className="text-brand-400 hidden sm:block mr-1" />
        </div>
      </div>
      {children && (
        <div className="flex gap-2 items-center">
          {children}
        </div>
      )}
    </div>
  )
}
