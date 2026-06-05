import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Step {
  title: string
  description: string
  icon: string
  target: string
}

interface AppTourProps {
  open: boolean
  onClose: () => void
}

const steps: Step[] = [
  {
    title: 'داشبورد',
    description: 'در این بخش می‌توانید آمار کلی کلینیک، درآمدها، نوبت‌ها و هشدارها را مشاهده کنید.',
    icon: '',
    target: 'nav-dashboard',
  },
  {
    title: 'مدیریت بیماران',
    description: 'اطلاعات کامل بیماران را ثبت، جستجو و ویرایش کنید. امکان واردات و خروجی Excel نیز وجود دارد.',
    icon: '',
    target: 'nav-patients',
  },
  {
    title: 'نوبت‌دهی',
    description: 'نوبت‌های ویزیت را ثبت و مدیریت کنید. تقویم نوبت‌ها، لیست انتظار و گزارش نوبت‌ها در این بخش قرار دارد.',
    icon: '',
    target: 'nav-appointments',
  },
  {
    title: 'صورتحساب‌ها',
    description: 'مدیریت مالی و صورتحساب‌های بیماران، گزارش مالی و تسویه حساب پزشکان.',
    icon: '',
    target: 'nav-billing',
  },
  {
    title: 'تنظیمات',
    description: 'اطلاعات کلینیک، پروفایل کاربری، قالب‌های پیامک و تنظیمات پشتیبان را مدیریت کنید.',
    icon: '',
    target: 'nav-settings',
  },
]

export default function AppTour({ open, onClose }: AppTourProps) {
  const [step, setStep] = useState(0)
  const [show, setShow] = useState(open)

  useEffect(() => { setShow(open); if (!open) setStep(0) }, [open])

  const next = useCallback(() => {
    if (step < steps.length - 1) setStep(s => s + 1)
    else { onClose(); setStep(0) }
  }, [step, onClose])

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  if (!show) return null

  const current = steps[step]
  const isLast = step === steps.length - 1
  const progress = ((step + 1) / steps.length) * 100

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-brand-100/50"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-1 bg-surface-100">
            <div className="h-full bg-gradient-to-l from-brand-500 to-brand-300 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>

          <div className="p-6">
            <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-xl flex items-center justify-center text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-all">
              <X size={16} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center mx-auto mb-4 text-2xl">
              {current.icon}
            </div>

            <h3 className="text-lg font-bold text-surface-800 text-center mb-2">{current.title}</h3>
            <p className="text-sm text-surface-500 text-center leading-relaxed">{current.description}</p>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {steps.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-brand-500 w-6' : 'bg-surface-200'}`} />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button onClick={prev} disabled={step === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border-2 border-surface-200 text-surface-600 hover:border-brand-500 hover:text-brand-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              >
                <ChevronRight size={14} /> قبلی
              </button>

              {!isLast ? (
                <button onClick={next}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-sm shadow-brand-500/20 border-none cursor-pointer"
                >
                  بعدی <ChevronLeft size={14} />
                </button>
              ) : (
                <button onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-success-500 to-emerald-500 text-white hover:from-success-600 hover:to-emerald-600 transition-all shadow-sm shadow-success-500/20 border-none cursor-pointer"
                >
                  <Sparkles size={14} /> شروع کن!
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
