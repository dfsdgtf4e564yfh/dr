import { useState, useEffect, type ReactNode } from 'react'
import { Smartphone, Share2, Plus, Check, Download, Menu } from 'lucide-react'

interface Step {
  icon: typeof Smartphone
  label: string
  sub: string
}

const iosSteps: Step[] = [
  { icon: Share2, label: 'دکمه Share را در Safari بزنید', sub: 'مربع با فلش بالا — پایین صفحه' },
  { icon: Plus, label: 'Add to Home Screen را انتخاب کنید', sub: 'گزینه «افزودن به صفحه اصلی»' },
  { icon: Check, label: 'روی Add بزنید', sub: 'نام: کلینیک دکتر محمد طاهری' },
]

const androidSteps: Step[] = [
  { icon: Menu, label: 'منوی مرورگر را باز کنید', sub: 'سه نقطه ⋮ بالا سمت راست' },
  { icon: Plus, label: 'Add to Home Screen را بزنید', sub: 'گزینه «افزودن به صفحه اصلی»' },
  { icon: Check, label: 'روی Add / Install بزنید', sub: 'نام: کلینیک دکتر محمد طاهری' },
]

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  return /Android|iPhone|iPad|iPod/i.test(ua)
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
}

export default function PwaInstallBlocker({ children }: { children: ReactNode }) {
  const [showBlocker, setShowBlocker] = useState<boolean | null>(null)

  useEffect(() => {
    setShowBlocker(isMobile() && !isStandalone())
  }, [])

  useEffect(() => {
    const handler = () => setShowBlocker(false)
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  if (showBlocker === null) return null

  if (!showBlocker) return <>{children}</>

  const ios = isIOS()
  const steps = ios ? iosSteps : androidSteps

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-blue-700 via-blue-600 to-teal-500 flex flex-col items-center justify-center p-6 overflow-y-auto" dir="rtl">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 mx-auto mb-5 bg-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm">
          <Smartphone size={40} className="text-white" />
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-2">کلینیک دکتر محمد طاهری</h1>
        <p className="text-base text-white/80 mb-8 leading-relaxed">
          لطفاً برای استفاده از پنل مدیریت، ابتدا برنامه را روی گوشی خود نصب کنید
        </p>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-6 text-right">
          <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Download size={16} />
            مراحل نصب در {ios ? 'iPhone / iPad' : 'Android'}:
          </p>
          <div className="space-y-4">
            {steps.map(({ icon: Icon, label, sub }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{i + 1}. {label}</p>
                  <p className="text-xs text-white/60 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
          {ios && (
            <div className="mt-4 bg-amber-400/20 text-amber-200 text-xs rounded-xl p-3 leading-relaxed">
              توجه: در iPhone حتماً از مرورگر Safari استفاده کنید
            </div>
          )}
        </div>

        <p className="text-xs text-white/50">
          بعد از نصب، برنامه را از صفحه اصلی باز کنید
        </p>
      </div>
    </div>
  )
}
