import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface Shortcut {
  keys: string[]
  path: string
  label: string
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['g', 'd'], path: '/panel/dashboard', label: 'داشبورد' },
  { keys: ['g', 'p'], path: '/panel/patients', label: 'بیماران' },
  { keys: ['g', 'a'], path: '/panel/appointments', label: 'نوبت‌ها' },
  { keys: ['g', 'c'], path: '/panel/appointments/calendar', label: 'تقویم نوبت‌ها' },
  { keys: ['g', 'm'], path: '/panel/medical-records', label: 'پرونده پزشکی' },
  { keys: ['g', 'b'], path: '/panel/billing', label: 'صورتحساب‌ها' },
  { keys: ['g', 'r'], path: '/panel/billing/report', label: 'گزارش مالی' },
  { keys: ['g', 'u'], path: '/panel/users', label: 'کاربران' },
  { keys: ['g', 's'], path: '/panel/settings', label: 'تنظیمات' },
  { keys: ['g', 'w'], path: '/panel/waiting-list', label: 'لیست انتظار' },
  { keys: ['g', 'n'], path: '/panel/notifications', label: 'اعلانات' },
  { keys: ['g', 't'], path: '/panel/sms-templates', label: 'قالب‌های پیامک' },
]

export default function useKeyboardShortcuts(): Shortcut[] {
  const navigate = useNavigate()
  const bufferRef = useRef<string[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'SELECT') return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      bufferRef.current.push(e.key.toLowerCase())
      if (bufferRef.current.length > 2) bufferRef.current.shift()

      if (bufferRef.current.length === 2) {
        const seq = bufferRef.current.join('')
        const shortcut = SHORTCUTS.find(s => s.keys.join('') === seq)
        if (shortcut) {
          e.preventDefault()
          navigate(shortcut.path)
          bufferRef.current.length = 0
        }
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => { bufferRef.current.length = 0 }, 1000)
    }

    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [navigate])

  return SHORTCUTS
}
