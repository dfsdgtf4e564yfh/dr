import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Users, Calendar, DollarSign, TrendingUp, Activity, UserPlus, Clock, TrendingDown, Stethoscope, Wallet, Settings } from 'lucide-react'
import { getDashboardStats, getMonthlyIncome, getDoctorIncomePie, getPatientsTrend, getAlerts } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { handleApiError } from '../utils/apiError'
import { toPersianDigits, formatMoney, gregorianToJalali } from '../utils/jalali'
import { SkeletonCard, SkeletonChart } from '../components/Skeleton'
import { motion } from 'framer-motion'

import { KhatamBorder } from '../components/PersianDecoration'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#0891b2', '#14b8a6', '#3b82f6', '#8b5cf6']
const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
} as const
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
} as const

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [monthlyIncome, setMonthlyIncome] = useState<any[]>([])
  const [doctorIncome, setDoctorIncome] = useState<any[]>([])
  const [patientsTrend, setPatientsTrend] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any>({ unpaid_billings: [], today_appointments: [] })
  const [loading, setLoading] = useState<boolean>(true)
  const { hasRole, hasPermission, user } = useAuth()
  const navigate = useNavigate()

  const canIncome = hasPermission('dashboard_income')
  const canPatients = hasPermission('patients')
  const canBilling = hasPermission('billing')
  const canAppointments = hasPermission('appointments')

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const [s, mi, di, pt, al] = await Promise.all([
        getDashboardStats(), getMonthlyIncome(), getDoctorIncomePie(),
        getPatientsTrend(30), getAlerts(),
      ])
      setStats(s.data)
      const miData = mi.data as any
      setMonthlyIncome(Array.isArray(miData) ? miData : miData?.results || [])
      const diData = di.data as any
      setDoctorIncome(Array.isArray(diData) ? diData : diData?.results || [])
      const ptData = pt.data as any
      setPatientsTrend(Array.isArray(ptData) ? ptData : ptData?.results || [])
      setAlerts(al.data)
    } catch (err: any) { handleApiError(err, 'خطا در دریافت اطلاعات داشبورد') }
    finally { if (showLoading) setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const t = setInterval(() => fetchData(false), 60000)
    return () => clearInterval(t)
  }, [fetchData])

  const iranTimeStr = useMemo(() => {
    const d = new Date()
    const local = d.getTime() + d.getTimezoneOffset() * 60000
    return new Date(local + 210 * 60000).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
  }, [])

  const ws = (v: any) => v === 0 || v === '0' ? toPersianDigits('0') : formatMoney(v)

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-4">
          <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-6" style={{ minHeight: 170 }}>
            <div className="space-y-3">
              <div className="h-5 bg-white/20 rounded animate-pulse w-48" />
              <div className="h-3 bg-white/20 rounded animate-pulse w-64" />
            </div>
          </div>
        </div>
        <div className="col-span-12 xl:col-span-8"><SkeletonCard count={4} /></div>
      </div>
      <SkeletonChart height={280} />
    </div>
  )

  const statWidgets: any[] = []
  if (canPatients) {
    statWidgets.push({ label: 'بیماران جدید (ماه)', value: toPersianDigits(stats?.patients_this_month || 0), icon: UserPlus, color: 'bg-brand-50 text-brand-500' })
  }
  if (canIncome) {
    statWidgets.push({ label: 'درآمد ماهانه', value: formatMoney(stats?.monthly_income), icon: Wallet, color: 'bg-success-50 text-success-500' })
  }
  if (canBilling) {
    statWidgets.push({ label: 'صورتحساب معوق', value: formatMoney(stats?.pending_billings), icon: DollarSign, color: 'bg-warning-50 text-warning-500' })
  }
  if (canIncome) {
    statWidgets.push({ label: 'درآمد سالانه', value: formatMoney(stats?.yearly_income), icon: TrendingUp, color: 'bg-info-50 text-info-500' })
  }

  const hasTodayAppointments = alerts.today_appointments?.length > 0

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Row 1: Welcome + Stats */}
      <div className="grid grid-cols-12 gap-6">
        <motion.div variants={item} className="col-span-12 xl:col-span-4">
          <div className="card-gradient rounded-2xl p-6 h-full flex flex-col" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-white/60 text-xs font-medium mb-1">{iranTimeStr}</p>
                <h4 className="text-lg font-bold text-white leading-tight mb-2">
                  خوش‌آمدید، {user?.first_name || ''} {user?.last_name || ''}
                </h4>
                <p className="text-sm text-white/80 leading-relaxed max-w-xs">
                  {user?.role === 'admin'
                    ? 'به پنل مدیریت کلینیک دکتر محمد طاهری خوش آمدید'
                    : user?.role === 'doctor' || user?.role === 'psychologist'
                      ? 'دکتر گرامی، به پنل مدیریت کلینیک خوش آمدید'
                      : user?.role === 'reception'
                        ? 'همکار پذیرش، امروز چه برنامه‌ای داریم؟'
                        : user?.role === 'rtms'
                          ? 'کاربر ویژه گرامی، به پنل مدیریت کلینیک خوش آمدید'
                          : 'به پنل مدیریت کلینیک دکتر محمد طاهری خوش آمدید'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
            </div>
            <div className="mt-auto pt-4 flex gap-3">
              <button onClick={() => navigate('/panel/notifications')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 text-white border border-white/20 hover:bg-white/25 transition-all backdrop-blur-sm">
                <Activity size={14} /> اعلانات
              </button>
              {canPatients && (
                <button onClick={() => navigate('/panel/patients')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/15 text-white border border-white/20 hover:bg-white/25 transition-all backdrop-blur-sm">
                  <Users size={14} /> بیماران
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className={`col-span-12 ${statWidgets.length > 0 ? 'xl:col-span-8' : 'hidden'}`}>
          {statWidgets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {statWidgets.map((w: any, i: number) => (
                <div key={i} className="stat-card card-corner-ornament card-iranian">
                  <div className={`stat-icon ${w.color} rounded-2xl`} style={{background: 'linear-gradient(135deg, rgba(26,74,138,0.08), rgba(42,179,184,0.06))'}}>
                    <w.icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="stat-value num-persian truncate">{w.value}</h4>
                    <p className="stat-label">{w.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Row 2: Chart + Mini widgets */}
      <motion.div variants={item} className="grid grid-cols-12 gap-6">
        {canIncome && (
          <div className="col-span-12 xl:col-span-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h5 className="text-base font-bold text-surface-800">تعادل کلی</h5>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-xs text-surface-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-warning-400 inline-block" /> درآمد
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-surface-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-brand-500 inline-block" /> دریافتی
                  </span>
                </div>
              </div>
              <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 min-w-0">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyIncome} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tickFormatter={(m: any) => monthNames[m - 1]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={ws} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: any) => `${formatMoney(v)} تومان`} labelFormatter={(m: any) => monthNames[m - 1]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '8px 14px' }} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                      <Bar dataKey="total" name="درآمد" fill="#f59e0b" radius={[6, 6, 0, 0]} animationDuration={800} />
                      <Bar dataKey="paid" name="دریافت شده" fill="#2563eb" radius={[6, 6, 0, 0]} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="xl:w-56 flex-shrink-0 flex flex-row xl:flex-col gap-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50/70">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><DollarSign size={18} className="text-warning-500" /></div>
                    <div className="min-w-0"><span className="text-xs text-surface-400 font-medium">درآمد سالانه</span><h6 className="text-sm font-bold text-surface-800 mt-0.5">{formatMoney(stats?.yearly_income || 0)} تومان</h6></div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50/70">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><TrendingDown size={18} className="text-rose-500" /></div>
                    <div className="min-w-0"><span className="text-xs text-surface-400 font-medium">معوقات</span><h6 className="text-sm font-bold text-surface-800 mt-0.5">{formatMoney(stats?.pending_billings || 0)} تومان</h6></div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-50/70">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm"><Stethoscope size={18} className="text-success-500" /></div>
                    <div className="min-w-0"><span className="text-xs text-surface-400 font-medium">بیماران (امسال)</span><h6 className="text-sm font-bold text-surface-800 mt-0.5">{formatMoney(stats?.patients_this_month || 0)}</h6></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={canIncome ? 'col-span-12 xl:col-span-4' : 'col-span-12'}>
          <div className="grid grid-cols-1 gap-3">
            {/* Doctor shares pie */}
            {canIncome && (
              <div className="card !p-4">
                <h5 className="text-sm font-bold text-surface-800 mb-3">سهم پزشکان</h5>
                {doctorIncome.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={doctorIncome} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} animationDuration={800}>
                          {doctorIncome.map((_: any, idx: number) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => `${formatMoney(v)} تومان`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {doctorIncome.map((d: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-surface-50 transition-all">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-sm font-medium text-surface-700 flex-1 truncate">{d.name}</span>
                          <span className="text-sm font-bold text-surface-800">{formatMoney(d.value)}</span>
                          <span className="text-xs text-surface-400">{toPersianDigits(((d.value / doctorIncome.reduce((s: number, x: any) => s + x.value, 0)) * 100).toFixed(0))}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Wallet size={40} className="text-surface-200 mb-3" />
                    <p className="text-sm text-surface-400">اطلاعاتی ثبت نشده</p>
                  </div>
                )}
              </div>
            )}

            {/* Alerts */}
            <div className="card !p-4">
              <h5 className="text-sm font-bold text-surface-800 mb-3">هشدارها</h5>
              {alerts.unpaid_billings?.length > 0 || alerts.today_appointments?.length > 0 ? (
                <div className="space-y-4">
                  {alerts.unpaid_billings?.slice(0, 3).map((b: any) => (
                    <div key={b.id} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/50">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0"><p className="text-sm font-semibold text-surface-700">صورتحساب پرداخت نشده</p><p className="text-xs text-surface-400">{b.patient_name} - {formatMoney(b.amount)} تومان</p></div>
                    </div>
                  ))}
                  {alerts.today_appointments?.slice(0, 2).map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-info-50/50">
                      <span className="w-2 h-2 rounded-full bg-info-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0"><p className="text-sm font-semibold text-surface-700">نوبت امروز</p><p className="text-xs text-surface-400">{a.patient_name} - {a.time}</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Activity size={36} className="text-surface-200 mb-2" />
                  <p className="text-sm text-surface-400">هشدار جدیدی وجود ندارد</p>
                </div>
              )}
            </div>


          </div>
        </div>
      </motion.div>

      {/* Row 3: Appointments + Trend */}
      <motion.div variants={item} className="grid grid-cols-12 gap-6">
        <div className={`col-span-12 xl:col-span-6 ${!canAppointments ? 'hidden' : ''}`}>
          <div className="card p-6 h-full">
            <h5 className="text-sm font-bold text-surface-800 mb-4">نوبت‌های امروز</h5>
            {hasTodayAppointments ? (
              <div className="space-y-3">
                {alerts.today_appointments.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 py-2 border-b border-surface-50 last:border-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                      {a.patient_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-surface-700 truncate">{a.patient_name}</p><p className="text-xs text-surface-400">{a.doctor_name}</p></div>
                    <span className="text-xs font-bold text-brand-500 bg-brand-50 px-2.5 py-1 rounded-lg">{a.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar size={36} className="text-surface-200 mb-2" />
                <p className="text-sm text-surface-400">نوبتی برای امروز ثبت نشده</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-6">
          <div className="card p-6 h-full">
            <h5 className="text-sm font-bold text-surface-800 mb-4">روند ۳۰ روز اخیر</h5>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={patientsTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.12} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(d: any) => { if (!d) return ''; const p = d.split('-'); if (p.length !== 3) return d; const [, jm, jd] = gregorianToJalali(+p[0], +p[1], +p[2]); return `${toPersianDigits(jd)} ${monthNames[jm-1]}` }} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={ws} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => formatMoney(v)} labelFormatter={(d: any) => { if (!d) return ''; const p = d.split('-'); if (p.length !== 3) return d; const [jy, jm, jd] = gregorianToJalali(+p[0], +p[1], +p[2]); return `${toPersianDigits(jd)} ${monthNames[jm - 1]} ${toPersianDigits(jy)}` }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '8px 14px' }} cursor={{ stroke: '#2563eb', strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fill="url(#tg)" dot={false} animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <motion.div className="mt-2 flex items-center justify-center" variants={item}>
        <KhatamBorder className="w-full max-w-2xl" />
      </motion.div>
    </motion.div>
  )
}
