import { useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowLeft, LayoutDashboard, Users, FileText, DollarSign, Settings, Calendar, Clock, HardDrive, UserCircle, Bell, MessageSquare, History, Send, Activity, HandCoins, FileBarChart, Inbox, Archive, AlertTriangle, Filter } from 'lucide-react'
import { searchPatients } from '../services/api'
import type { Patient } from '../types'

interface NavSearchItem {
  to: string
  label: string
  icon: string
  keywords: string
  category: string
  sub?: string
}

interface AllItem extends Partial<NavSearchItem> {
  _type: 'page' | 'patient'
  to: string
  label: string
  icon: string
  category: string
  sub?: string
}

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Users, FileText, DollarSign, Settings, Calendar, Clock,
  HardDrive, UserCircle, Bell, MessageSquare, History, Send, Activity,
  HandCoins, FileBarChart, Inbox, Archive, AlertTriangle,
}

const navItems: NavSearchItem[] = [
  { to: '/dashboard', label: 'داشبورد', icon: 'LayoutDashboard', keywords: 'main home dashboard', category: 'صفحات اصلی' },
  { to: '/patients', label: 'بیماران', icon: 'Users', keywords: 'patients client مراجع', category: 'صفحات اصلی' },
  { to: '/appointments', label: 'نوبت‌ها', icon: 'Calendar', keywords: 'appointment visit ویزیت', category: 'نوبت‌ها' },
  { to: '/appointments/calendar', label: 'تقویم نوبت‌ها', icon: 'Calendar', keywords: 'calendar تقویم', category: 'نوبت‌ها' },
  { to: '/waiting-list', label: 'لیست انتظار', icon: 'Clock', keywords: 'waiting queue صف', category: 'نوبت‌ها' },
  { to: '/appointments/report', label: 'گزارش نوبت‌ها', icon: 'FileBarChart', keywords: 'report appointments', category: 'نوبت‌ها' },
  { to: '/medical-records', label: 'پرونده پزشکی', icon: 'FileText', keywords: 'medical records پرونده', category: 'پزشکی' },
  { to: '/doctor-finance', label: 'حساب پزشکان', icon: 'HandCoins', keywords: 'doctor finance حساب', category: 'پزشکی' },
  { to: '/referral-letters', label: 'نامه‌های ارجاع', icon: 'Send', keywords: 'referral letter ارجاع', category: 'پزشکی' },
  { to: '/diagnosis-report', label: 'گزارش تشخیص', icon: 'Activity', keywords: 'diagnosis report تشخیص', category: 'پزشکی' },
  { to: '/diagnosis-drugs', label: 'تشخیص و دارو', icon: 'FileText', keywords: 'diagnosis drugs دارو', category: 'پزشکی' },
  { to: '/tms-forms', label: 'فرم TMS', icon: 'Activity', keywords: 'tms فرم', category: 'فرم‌ها' },
  { to: '/billing', label: 'صورتحساب', icon: 'DollarSign', keywords: 'billing صورتحساب', category: 'مالی' },
  { to: '/billing/report', label: 'گزارش مالی', icon: 'FileBarChart', keywords: 'financial report مالی', category: 'مالی' },
  { to: '/settlements', label: 'تسویه حساب', icon: 'DollarSign', keywords: 'settlement تسویه', category: 'مالی' },
  { to: '/notifications', label: 'اعلانات', icon: 'Bell', keywords: 'notifications اعلان', category: 'مدیریت سیستم' },
  { to: '/users', label: 'کاربران', icon: 'UserCircle', keywords: 'users کاربر', category: 'مدیریت سیستم' },
  { to: '/backup', label: 'پشتیبان', icon: 'HardDrive', keywords: 'backup پشتیبان', category: 'مدیریت سیستم' },
  { to: '/sms-templates', label: 'قالب‌های پیامک', icon: 'MessageSquare', keywords: 'sms template قالب', category: 'مدیریت سیستم' },
  { to: '/sms-history', label: 'تاریخچه پیامک‌ها', icon: 'History', keywords: 'sms history تاریخچه', category: 'مدیریت سیستم' },
  { to: '/settings', label: 'تنظیمات', icon: 'Settings', keywords: 'settings تنظیمات', category: 'مدیریت سیستم' },
  { to: '/deleted-items', label: 'موارد حذف شده', icon: 'Archive', keywords: 'deleted حذف', category: 'مدیریت سیستم' },
]

const categories = ['همه', 'صفحات اصلی', 'نوبت‌ها', 'پزشکی', 'مالی', 'فرم‌ها', 'مدیریت سیستم', 'بیماران']

function fuzzyMatch(text: string, query: string): boolean {
  const s = text.toLowerCase()
  let qi = 0
  for (let i = 0; i < s.length && qi < query.length; i++) {
    if (s[i] === query[qi]) qi++
  }
  return qi === query.length
}

function highlightText(text: string, query: string): string {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split('').join('|')})`, 'gi')
  return text.replace(regex, (match) => `\x00hl\x00${match}\x00hl\x00`)
}

function renderHighlighted(text: string): ReactNode[] {
  const parts = text.split('\x00hl\x00')
  return parts.map((part, i) =>
    i % 2 === 1 ? <span key={i} className="text-brand-500 font-bold">{part}</span> : part
  )
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NavSearchItem[]>([])
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeFilter, setActiveFilter] = useState('همه')
  const [showFilter, setShowFilter] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setPatientResults([])
      setSelectedIndex(0)
      setActiveFilter('همه')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filterNav = useCallback((q: string, category: string) => {
    if (!q.trim() && category === 'همه') return navItems
    const s = q.trim().toLowerCase()
    let filtered = navItems
    if (category !== 'همه') {
      filtered = filtered.filter(item => item.category === category)
    }
    if (!s) return filtered.slice(0, 8)
    return filtered.filter(item =>
      fuzzyMatch(item.label, s) ||
      fuzzyMatch(item.keywords, s) ||
      fuzzyMatch(item.to, s)
    )
  }, [])

  useEffect(() => {
    if (activeFilter !== 'همه' && activeFilter !== 'بیماران') {
      setResults(filterNav(query, activeFilter))
      setPatientResults([])
      return
    }
    if (!query.trim()) {
      setResults(navItems)
      setPatientResults([])
      return
    }
    setResults(filterNav(query, 'همه'))

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const delay = setTimeout(async () => {
      try {
        const { data } = await searchPatients(query)
        if (!controller.signal.aborted) {
          setPatientResults(Array.isArray(data) ? data : (data as any).results || [])
        }
      } catch {
        setPatientResults([])
      }
    }, 300)
    return () => {
      clearTimeout(delay)
      controller.abort()
    }
  }, [query, filterNav, activeFilter])

  const pageItems = activeFilter === 'بیماران' ? [] : results
  const patients = (activeFilter === 'همه' || activeFilter === 'بیماران') ? patientResults : []

  const allItems: AllItem[] = [
    ...pageItems.map(r => ({ ...r, _type: 'page' as const })),
    ...patients.map(p => ({ _type: 'patient' as const, to: `/patients/${p.id}`, label: `${p.first_name} ${p.last_name}`, sub: p.phone || p.national_id || '', icon: 'Users', category: 'بیماران' })),
  ]

  useEffect(() => {
    setSelectedIndex(0)
  }, [query, activeFilter])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, Math.max(allItems.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      handleSelect(allItems[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSelect = (item: AllItem) => {
    navigate(item.to)
    onClose()
  }

  if (!open) return null

  const Icon = (name: string) => iconMap[name] || LayoutDashboard

  const groupedItems = allItems.reduce<Record<string, AllItem[]>>((acc, item) => {
    const cat = item.category || 'سایر'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 bg-black/40 z-[70] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.15s ease' }}
      >
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 border-none bg-transparent font-sans text-sm text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="جستجوی صفحات، بیماران..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            dir="rtl"
          />
          <div className="relative">
            <button onClick={() => setShowFilter(!showFilter)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-all text-slate-400 hover:text-brand-500">
              <Filter size={15} />
            </button>
            {showFilter && (
              <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-10 py-1 min-w-[130px]">
                {categories.map(cat => (
                  <button key={cat} onClick={() => { setActiveFilter(cat); setShowFilter(false) }}
                    className={`w-full text-right px-3 py-2 text-xs font-medium transition-colors ${activeFilter === cat ? 'bg-brand-50 text-brand-500' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[11px] font-medium text-slate-400 ltr">
            {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}K
          </kbd>
        </div>
        {activeFilter !== 'همه' && (
          <div className="px-5 py-2 bg-brand-50/50 border-b border-brand-100/50">
            <span className="text-[11px] text-brand-600 font-semibold">فیلتر: {activeFilter}</span>
          </div>
        )}
        <div className="max-h-80 overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <AlertTriangle size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">نتیجه‌ای یافت نشد</p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <div className="px-5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{category}</div>
                {items.map((item, i) => {
                  const idx = allItems.indexOf(item)
                  const ItemIcon = Icon(item.icon)
                  return (
                    <button
                      key={`${item._type}-${item.to}-${i}`}
                      className={`w-full text-right px-5 py-3 flex items-center gap-3.5 transition-all ${idx === selectedIndex ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${idx === selectedIndex ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20' : 'bg-slate-50 text-slate-400'}`}>
                        <ItemIcon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{query ? renderHighlighted(highlightText(item.label, query.trim())) : item.label}</p>
                        {item.sub && <p className="text-[11px] text-slate-400 truncate">{item.sub}</p>}
                      </div>
                      <span className="text-[10px] text-slate-300 bg-slate-50 px-2 py-0.5 rounded-md">{item._type === 'patient' ? 'بیمار' : 'صفحه'}</span>
                      <ArrowLeft size={14} className="text-slate-300 shrink-0" />
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
        <div className="px-5 py-2.5 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">↑↓</kbd> حرکت</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">↵</kbd> انتخاب</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 font-medium">Esc</kbd> بستن</span>
          <span className="mr-auto flex items-center gap-1"><Filter size={11} /> فیلتر دسته</span>
        </div>
      </div>
    </div>
  )
}
