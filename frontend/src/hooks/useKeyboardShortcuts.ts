import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Shortcut {
  keys: string[]
  path: string
  label: string
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['g', 'd'], path: '/dashboard', label: 'داشبورد' },
  { keys: ['g', 'p'], path: '/patients', label: 'بیماران' },
  { keys: ['g', 'a'], path: '/appointments', label: 'نوبت‌ها' },
  { keys: ['g', 'c'], path: '/appointments/calendar', label: 'تقویم نوبت‌ها' },
  { keys: ['g', 'm'], path: '/medical-records', label: 'پرونده پزشکی' },
  { keys: ['g', 'b'], path: '/billing', label: 'صورتحساب‌ها' },
  { keys: ['g', 'r'], path: '/billing/report', label: 'گزارش مالی' },
  { keys: ['g', 'u'], path: '/users', label: 'کاربران' },
  { keys: ['g', 's'], path: '/settings', label: 'تنظیمات' },
  { keys: ['g', 'w'], path: '/waiting-list', label: 'لیست انتظار' },
  { keys: ['g', 'n'], path: '/notifications', label: 'اعلانات' },
  { keys: ['g', 't'], path: '/sms-templates', label: 'قالب‌های پیامک' },
]

export default function useKeyboardShortcuts(): Shortcut[] {
  const navigate = useNavigate()
  const buffer: string[] = []

  useEffect(() => {
    const handler = function(this: any, e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'SELECT') return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      buffer.push(e.key.toLowerCase())
      if (buffer.length > 2) buffer.shift()

      if (buffer.length === 2) {
        const seq = buffer.join('')
        const shortcut = SHORTCUTS.find(s => s.keys.join('') === seq)
        if (shortcut) {
          e.preventDefault()
          navigate(shortcut.path)
          buffer.length = 0
        }
      }

      clearTimeout(this._keyTimeout)
      this._keyTimeout = setTimeout(() => { buffer.length = 0 }, 1000)
    }

    const timeoutRef: any = { _keyTimeout: null }

    const listener = (e: KeyboardEvent) => handler.call(timeoutRef, e)
    document.addEventListener('keydown', listener)
    return () => {
      document.removeEventListener('keydown', listener)
      clearTimeout(timeoutRef._keyTimeout)
    }
  }, [navigate])

  return SHORTCUTS
}
