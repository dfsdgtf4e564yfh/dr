import { useState, useMemo, useEffect, useRef, useCallback } from 'react'

import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { mediaUrl } from '../utils/jalali'
import {
  LayoutDashboard, Users, Calendar, FileText, DollarSign,
  UserCircle, Settings, LogOut, Menu, ChevronDown,
  HardDrive, FileBarChart, HandCoins, Search,
  Bell, Send, Activity, AlertTriangle, CheckCircle,
  MessageSquare, History, Inbox, Archive, Command, Sparkles, Clock, Download, Shield, Image
} from 'lucide-react'
import { getNotifications } from '../services/api'
import { toPersianDigits, formatMoney, nowJalali, JALALI_MONTH_NAMES, gregorianToJalali } from '../utils/jalali'
import CommandPalette from './CommandPalette'
import IranClock from './IranClock'
import ProfileModal from './ProfileModal'
import iOSInstallGuide from './iOSInstallGuide'
import AppTour from './AppTour'
import usePWAInstall from '../hooks/usePWAInstall'
import type { NotificationsData, Appointment, Billing } from '../types'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<any>
  permission?: string
  end?: boolean
}

interface MenuGroup {
  label: string
  icon: React.ComponentType<any>
  items: NavItem[]
}

interface NotifItem {
  id: number
  type: string
  label: string
  sub: string
  to: string
}

const topItems: NavItem[] = [
  { to: '/panel/dashboard', label: 'داشبورد', icon: LayoutDashboard, permission: 'dashboard' },
  { to: '/panel/patients', label: 'بیماران', icon: Users, permission: 'patients' },
]

const groupColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'نوبت‌ها': { bg: 'bg-blue-800/20', text: 'text-blue-300', border: 'border-blue-700/30', dot: 'bg-blue-400' },
  'پزشکی': { bg: 'bg-emerald-800/20', text: 'text-emerald-300', border: 'border-emerald-700/30', dot: 'bg-emerald-400' },
  'مالی': { bg: 'bg-amber-800/20', text: 'text-amber-300', border: 'border-amber-700/30', dot: 'bg-amber-400' },
  'مدیریت سیستم': { bg: 'bg-sky-800/20', text: 'text-sky-300', border: 'border-sky-700/30', dot: 'bg-sky-400' },
  'گزارش‌ها': { bg: 'bg-violet-800/20', text: 'text-violet-300', border: 'border-violet-700/30', dot: 'bg-violet-400' },
  'کلینیک': { bg: 'bg-rose-800/20', text: 'text-rose-300', border: 'border-rose-700/30', dot: 'bg-rose-400' },
}

const menuGroups: MenuGroup[] = [
  {
    label: 'نوبت‌ها', icon: Calendar,
    items: [
      { to: '/panel/appointments', label: 'نوبت‌ها', icon: Calendar, end: true, permission: 'appointments' },
      { to: '/panel/appointments/calendar', label: 'تقویم نوبت‌ها', icon: Calendar, permission: 'appointments_calendar' },
      { to: '/panel/waiting-list', label: 'لیست انتظار', icon: Clock, permission: 'waiting_list' },
    ],
  },
  {
    label: 'پزشکی', icon: FileText,
    items: [
      { to: '/panel/medical-records', label: 'پرونده پزشکی', icon: FileText, permission: 'medical_records' },
      { to: '/panel/diagnosis-report', label: 'گزارش تشخیص', icon: Activity, permission: 'diagnosis_report' },
      { to: '/panel/dicom-viewer', label: 'تصاویر پزشکی', icon: Image, permission: 'dicom_viewer' },
      { to: '/panel/tms-forms', label: 'فرم TMS', icon: Activity, permission: 'medical_records' },
    ],
  },
  {
    label: 'مالی', icon: DollarSign,
    items: [
      { to: '/panel/billing', label: 'صورتحساب', icon: DollarSign, end: true, permission: 'billing' },
      { to: '/panel/settlements', label: 'تسویه حساب', icon: DollarSign, permission: 'settlements' },
    ],
  },
  {
    label: 'کلینیک', icon: HandCoins,
    items: [
      { to: '/panel/doctor-finance', label: 'حساب پزشکان', icon: HandCoins, permission: 'doctor_finance' },
      { to: '/panel/diagnosis-drugs', label: 'تشخیص و دارو', icon: FileText, permission: 'diagnosis_drugs' },
      { to: '/panel/referral-letters', label: 'نامه‌های ارجاع', icon: Send, permission: 'referral_letters' },
    ],
  },
  {
    label: 'گزارش‌ها', icon: FileBarChart,
    items: [
      { to: '/panel/appointments/report', label: 'گزارش نوبت‌ها', icon: FileBarChart, permission: 'appointments_report' },
      { to: '/panel/diagnosis-report', label: 'گزارش تشخیص', icon: Activity, permission: 'diagnosis_report' },
      { to: '/panel/billing/report', label: 'گزارش مالی', icon: FileBarChart, permission: 'billing_report' },
    ],
  },
  {
    label: 'مدیریت سیستم', icon: Settings,
    items: [
        { to: '/panel/notifications', label: 'اعلانات', icon: Bell, permission: 'notifications' },
      { to: '/panel/activity-log', label: 'لاگ‌ها', icon: History, permission: 'activity_log' },
       { to: '/panel/users', label: 'کاربران', icon: UserCircle, permission: 'users' },
         { to: '/panel/roles', label: 'نقش‌ها', icon: Shield, permission: 'roles_manage' },
         { to: '/panel/backup', label: 'پشتیبان', icon: HardDrive, permission: 'backup' },
     { to: '/panel/deleted-items', label: 'موارد حذف شده', icon: Archive, permission: 'deleted_items' },
    { to: '/panel/bulk-sms', label: 'ارسال پیامک گروهی', icon: Send, permission: 'settings' },
         { to: '/panel/sms-templates', label: 'قالب‌های پیامک', icon: MessageSquare, permission: 'settings' },
         { to: '/panel/sms-history', label: 'تاریخچه پیامک‌ها', icon: History, permission: 'settings' },
          { to: '/panel/panel-settings', label: 'تنظیمات پنل', icon: Settings, permission: 'settings' },
      { to: '/panel/settings', label: 'تنظیمات', icon: Settings, permission: 'settings' },
    ],
  },
]

const roleLabel: Record<string, string> = {
  admin: 'مدیر کلینیک',
  reception: 'پذیرش',
  doctor: 'درمانگر',
  psychologist: 'روانشناس / درمانگر',
  rtms: 'کاربر ویژه',
  support: 'پشتیبانی',
}

const allNavItems = [
  ...topItems,
  ...menuGroups.flatMap(g => g.items),
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifData, setNotifData] = useState<NotificationsData | null>(null)
  const { user, logout, hasPermission, loadUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const bellRef = useRef<HTMLDivElement | null>(null)
  const notifRef = useRef<HTMLDivElement | null>(null)
  const [profileModal, setProfileModal] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [iosGuideOpen, setIosGuideOpen] = useState(false)
  const { isInstalled, isIOS } = usePWAInstall()

  useEffect(() => {
    if (user && !user.profile_completed && (user.first_name || '').trim() === '' && (user.last_name || '').trim() === '') {
      setProfileModal(true)
    }
  }, [user])

  const loadNotif = useCallback(() => {
    getNotifications().then(({ data }) => setNotifData(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (notifOpen && !notifData) loadNotif()
  }, [notifOpen, notifData, loadNotif])

  useEffect(() => {
    loadNotif()
    const t = setInterval(loadNotif, 30000)
    return () => clearInterval(t)
  }, [loadNotif])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(p => !p)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (bellRef.current?.contains(target) || notifRef.current?.contains(target)) return
      setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const pageTitle = useMemo(() => {
    const sorted = [...allNavItems].sort((a, b) => b.to.length - a.to.length)
    const match = sorted.find(item => {
      if (item.to === '/panel/dashboard') return location.pathname === '/panel/dashboard'
      return location.pathname.startsWith(item.to)
    })
    return match?.label || 'داشبورد'
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/panel')
  }

  const isAppointmentSoon = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    const now = new Date()
    const offset = 3.5 * 60
    const local = now.getTime() + now.getTimezoneOffset() * 60000
    const iranNow = new Date(local + offset * 60000)
    const apt = new Date(iranNow)
    apt.setHours(h, m, 0, 0)
    const diff = (apt.getTime() - iranNow.getTime()) / 60000
    return diff
  }

  const notifCount = useMemo(() => {
    if (!notifData) return 0
    let count = 0
    for (const a of (notifData as NotificationsData).today_appointments || []) {
      if (a.status === 'scheduled') {
        const diff = isAppointmentSoon(a.time)
        if (diff > -60 && diff <= 60) count++
      }
    }
    count += ((notifData as NotificationsData).unpaid_billings || []).length
    count += ((notifData as NotificationsData).stored_notifications || []).filter(n => !n.is_read).length
    return count
  }, [notifData])

  const notifItems = useMemo((): NotifItem[] => {
    if (!notifData) return []
    const items: NotifItem[] = []
    for (const a of ((notifData as NotificationsData).today_appointments || []) as Appointment[]) {
      if (a.status === 'scheduled') {
        const diff = isAppointmentSoon(a.time)
        if (diff > -60 && diff <= 60) {
          items.push({
            id: a.id, type: 'reminder',
            label: `یادآوری: ${a.patient_name}`,
            sub: `${a.time} - ${a.doctor_name}${diff <= 0 ? ' (اکنون)' : ` تا ${Math.ceil(diff)} دقیقه`}`,
            to: '/panel/appointments',
          })
        }
      }
    }
    for (const b of ((notifData as NotificationsData).unpaid_billings || []).slice(0, 3) as Billing[]) {
      items.push({
        id: b.id, type: 'billing',
        label: `صورتحساب: ${b.patient_name}`,
        sub: `${formatMoney(b.remaining)} تومان باقی‌مانده`,
        to: '/panel/billing',
      })
    }
    for (const r of (notifData as NotificationsData).reminders || [] as any[]) {
      items.push({
        id: r.id, type: 'reminder',
        label: `یادآوری: ${r.patient_name}`,
        sub: `${r.date} ساعت ${r.time}`,
        to: '/panel/notifications',
      })
    }
    for (const n of ((notifData as NotificationsData).stored_notifications || []).slice(0, 5)) {
      items.push({
        id: n.id, type: 'stored',
        label: n.title,
        sub: n.message || '',
        to: '/panel/notifications',
      })
    }
    return items.slice(0, 5)
  }, [notifData])

  const notifIcon = (type: string) => {
    if (type === 'appointment' || type === 'reminder') return <Clock size={14} className="text-amber-500" />
    if (type === 'billing') return <AlertTriangle size={14} className="text-red-500" />
    if (type === 'stored') return <Bell size={14} className="text-brand-500" />
    return <Bell size={14} className="text-brand-500" />
  }

  const groupPermMap: Record<string, string> = {
    'نوبت‌ها': 'show_appointments_menu',
    'پزشکی': 'show_medical_menu',
    'مالی': 'show_financial_menu',
    'گزارش‌ها': 'show_reports_menu',
    'کلینیک': 'show_clinic_menu',
    'مدیریت سیستم': 'show_system_menu',
  }
  const visibleTopItems = topItems.filter(item => hasPermission(item.permission!))
  const supportInboxItem = user?.role === 'support' || user?.role === 'rtms' ? { to: '/panel/support-inbox', label: 'صندوق پیام‌ها', icon: Inbox, permission: 'support_inbox' } as NavItem : null
  if (supportInboxItem) visibleTopItems.push(supportInboxItem)

  const sidebarGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => hasPermission(item.permission!)),
  }))

  return (
    <>
    <div className="flex h-screen bg-slate-50">
      <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)} />

        <aside className={`sidebar sidebar-geo-pattern ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div className="sidebar-logo-text">
            <h3>کلینیک دکتر طاهری</h3>
            <span>مدیریت مطب</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleTopItems.map(item => (
            <NavLink key={item.to} to={item.to} end
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => isActive ? 'active' : ''}>
              <item.icon size={18} className="nav-icon" />
              {item.label}
            </NavLink>
          ))}
          {sidebarGroups.map(group => {
            if (group.items.length === 0) return null
            const gc = groupColors[group.label] || { bg: 'bg-surface-50', text: 'text-surface-500', border: 'border-surface-200', dot: 'bg-surface-400' }
            const groupPerm = groupPermMap[group.label]
            const hasGroupView = groupPerm ? hasPermission(groupPerm) : true
            if (!hasGroupView) {
              return group.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => isActive ? 'active' : ''}>
                  <item.icon size={18} className="nav-icon" />
                  {item.label}
                </NavLink>
              ))
            }
            return (
            <div key={group.label}>
              <button onClick={() => toggleGroup(group.label)}
                className={`sidebar-group-btn ${expandedGroups[group.label] ? gc.bg : ''}`}>
                <div className="flex items-center gap-3.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${gc.dot}`} />
                  <span className={expandedGroups[group.label] ? gc.text : ''}>{group.label}</span>
                </div>
                <ChevronDown size={16} className={`sidebar-chevron ${expandedGroups[group.label] ? 'rotated' : ''}`} />
              </button>
              {expandedGroups[group.label] && (
                <div className="sidebar-subnav">
                  {group.items.map(item => (
                    <NavLink key={item.to} to={item.to}
                      end={item.end}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => isActive ? `active ${gc.bg}` : ''}>
                      <item.icon size={16} className="nav-icon" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )})}
        </nav>

        <div className="sidebar-footer">
          {/* تزئین اسلیمی */}
          <div style={{padding: '0 0.875rem 0.5rem', opacity: 0.4}}>
            <div style={{height: 1, background: 'linear-gradient(90deg, transparent, rgba(42,179,184,0.4), rgba(230,126,34,0.3), transparent)'}} />
          </div>
          {!isInstalled && isIOS && (
            <a href="#" onClick={(e) => { e.preventDefault(); setIosGuideOpen(true) }}
              className="!text-amber-300 hover:!text-amber-200 !text-[11px]">
              <Download size={16} className="nav-icon" />
              نصب برنامه (راهنمای iOS)
            </a>
          )}

          <a href="#" onClick={(e) => { e.preventDefault(); handleLogout() }}>
            <LogOut size={18} className="nav-icon !text-red-400" />
            خروج از سیستم
          </a>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <header className="topbar">
          <div className="topbar-right">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm lg:text-xl truncate">{pageTitle}</h2>
              <div className="breadcrumb truncate">
                پنل مدیریت / <span>{pageTitle}</span>
              </div>
            </div>
          </div>
          <div className="topbar-left">
            <button onClick={() => setCmdOpen(true)} className="hidden md:flex items-center gap-2 text-xs text-surface-500 font-medium bg-surface-100 px-3 py-1.5 rounded-xl border border-surface-200 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 transition-all cursor-pointer">
              <Command size={14} />
              <span>جستجو</span>
              <kbd className="px-1 py-0.5 rounded bg-slate-200 text-[10px] text-slate-400">Ctrl+K</kbd>
            </button>
            <IranClock />
            <div ref={bellRef} className="relative">
              <button className="topbar-action-btn" onClick={() => setNotifOpen(o => !o)}>
                <Bell size={18} />
                {notifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow">
                    {toPersianDigits(Math.min(notifCount, 99))}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div ref={notifRef} className="w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-[9999] overflow-hidden card-iranian animate-fade-in-up" style={{ position: 'absolute', left: 0, right: 'auto', top: '100%', marginTop: '8px' }}>
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between panel-header-iranian">
                    <span className="text-xs font-bold text-slate-700">آخرین اعلانات</span>
                    <button onClick={() => { setNotifOpen(false); navigate('/panel/notifications') }}
                      className="text-[11px] text-brand-500 font-semibold hover:underline">
                      مشاهده همه
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifItems.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <CheckCircle size={24} className="mx-auto text-emerald-400 mb-2" />
                        <p className="text-xs text-slate-400">اعلان جدیدی وجود ندارد</p>
                      </div>
                    ) : (
                      notifItems.map((item, i) => (
                        <button key={`${item.type}-${item.id}-${i}`} onClick={() => { setNotifOpen(false); navigate(item.to) }}
                          className="w-full text-right px-4 py-3 flex items-start gap-3 hover:bg-slate-50 border-b border-slate-50 last:border-b-0 transition-colors">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            {notifIcon(item.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{item.label}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.sub}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="topbar-profile cursor-pointer" onClick={() => setProfileModal(true)}>
              <div className="hidden md:block">
                <div className="name">{user?.first_name} {user?.last_name}</div>
                <div className="role">{user?.role ? (roleLabel[user.role] || user.role) : ''}</div>
              </div>
              <div className="topbar-avatar">
                {user?.avatar ? <img src={mediaUrl(user.avatar)} alt="" className="w-full h-full rounded-xl object-cover" /> : user?.first_name?.[0] || user?.username?.[0] || '?'}
              </div>
            </div>
          </div>
        </header>

        <div className="content p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full iranian-geo">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <ProfileModal open={profileModal} onClose={() => setProfileModal(false)} user={user} loadUser={loadUser} />

      <AppTour open={tourOpen} onClose={() => setTourOpen(false)} />

      <iOSInstallGuide open={iosGuideOpen} onClose={() => setIosGuideOpen(false)} />
    </div>
    </>
  )
}
