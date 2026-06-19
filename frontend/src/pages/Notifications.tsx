import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Calendar, Clock, CheckCircle, XCircle, AlertTriangle,
  DollarSign, Activity, ArrowLeft, Zap
} from 'lucide-react'
import { getNotifications } from '../services/api'
import { toJalali, toPersianDigits, formatMoney } from '../utils/jalali'
import { SkeletonCard } from '../components/Skeleton'

export default function Notifications() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  useEffect(() => {
    getNotifications()
      .then(({ data }: any) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <SkeletonCard count={6} />

  const summary = data?.today_summary || {}
  const unpaidTotal = data?.unpaid_billings?.reduce((s: number, b: any) => s + b.remaining, 0) || 0

  const summaryCards = [
    {
      label: 'نوبت‌های امروز', value: toPersianDigits(summary.total || 0),
      color: 'stat-icon-blue', icon: Calendar, to: '/appointments',
    },
    {
      label: 'در انتظار', value: toPersianDigits(summary.scheduled || 0),
      color: 'stat-icon-orange', icon: Clock, to: '/waiting-list',
    },
    {
      label: 'انجام شده', value: toPersianDigits(summary.completed || 0),
      color: 'stat-icon-green', icon: CheckCircle, to: '/appointments/calendar',
    },
    {
      label: 'لغو شده', value: toPersianDigits(summary.cancelled || 0),
      color: 'stat-icon-red', icon: XCircle, to: '/appointments',
    },
    {
      label: 'صورتحساب معوق', value: `${formatMoney(unpaidTotal)} تومان`,
      color: 'stat-icon-red', icon: DollarSign, to: '/billing',
    },
    {
      label: 'نوبت‌های پیش رو', value: toPersianDigits(data?.upcoming_appointments?.length || 0),
      color: 'stat-icon-brand', icon: Activity, to: '/appointments/calendar',
    },
  ]

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      scheduled: 'bg-amber-50 text-amber-600 border-amber-200',
      completed: 'bg-green-50 text-green-600 border-green-200',
      cancelled: 'bg-red-50 text-red-600 border-red-200',
      rescheduled: 'bg-blue-50 text-blue-600 border-blue-200',
    }
    const label: Record<string, string> = {
      scheduled: 'در انتظار', completed: 'انجام شده',
      cancelled: 'لغو شده', rescheduled: 'تغییر یافته',
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[status] || ''}`}>
        {label[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">اعلانات و یادآوری‌ها</h1>
        <span className="text-sm text-slate-400">{toJalali(new Date().toISOString().split('T')[0])}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {summaryCards.map((card: any, i: number) => (
          <button key={i} onClick={() => navigate(card.to)}
            className="stat-card card-corner-ornament w-full text-right cursor-pointer">
            <div className={`stat-icon ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div className="stat-info">
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="panel card-iranian">
          <div className="panel-header panel-header-iranian">
            <h3 className="flex items-center gap-2">
              <Calendar size={16} className="text-brand-500" />
              نوبت‌های امروز
            </h3>
            <button onClick={() => navigate('/panel/appointments')}
              className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:underline">
              مشاهده همه <ArrowLeft size={14} />
            </button>
          </div>
          <div className="activity-list">
            {(!data?.today_appointments || data.today_appointments.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">نوبتی برای امروز ثبت نشده</p>
            ) : (
              data.today_appointments.map((a: any) => (
                <div key={a.id} className="activity-item">
                  <div className={`act-icon ${
                    a.status === 'completed' ? 'act-icon-green' :
                    a.status === 'cancelled' ? 'act-icon-orange' : 'act-icon-blue'
                  }`}>
                    {a.status === 'completed' ? <CheckCircle size={16} /> :
                     a.status === 'cancelled' ? <XCircle size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="act-info flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p>{a.patient_name}</p>
                      {statusBadge(a.status)}
                    </div>
                    <div className="act-time flex items-center gap-3">
                      <span>{a.time}</span>
                      <span>{a.doctor_name}</span>
                      {a.treatment && <span className="text-slate-300">|</span>}
                      {a.treatment && <span>{a.treatment}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel card-iranian">
          <div className="panel-header panel-header-iranian">
            <h3 className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              صورتحساب‌های معوق
            </h3>
            <button onClick={() => navigate('/panel/billing')}
              className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:underline">
              مشاهده همه <ArrowLeft size={14} />
            </button>
          </div>
          <div className="activity-list">
            {(!data?.unpaid_billings || data.unpaid_billings.length === 0) ? (
              <p className="text-xs text-green-500 py-4 text-center font-medium">همه صورتحساب‌ها پرداخت شدهاند</p>
            ) : (
              data.unpaid_billings.map((b: any) => (
                <div key={b.id} className="activity-item">
                  <div className="act-icon act-icon-orange">
                    <DollarSign size={16} />
                  </div>
                  <div className="act-info flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p>{b.patient_name}</p>
                      <span className={`text-[11px] font-semibold ${
                        b.status === 'pending' ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        {b.status === 'pending' ? 'پرداخت نشده' : 'پرداخت جزئی'}
                      </span>
                    </div>
                    <div className="act-time">
                      باقی‌مانده: {formatMoney(b.remaining)} تومان
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel card-iranian">
          <div className="panel-header panel-header-iranian">
            <h3 className="flex items-center gap-2">
              <Activity size={16} className="text-brand-500" />
              نوبت‌های پیش رو (۷ روز آینده)
            </h3>
            <button onClick={() => navigate('/panel/appointments/calendar')}
              className="text-xs text-brand-500 font-semibold flex items-center gap-1 hover:underline">
              تقویم <ArrowLeft size={14} />
            </button>
          </div>
          <div className="activity-list">
            {(!data?.upcoming_appointments || data.upcoming_appointments.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">نوبتی برای روزهای آینده وجود ندارد</p>
            ) : (
              data.upcoming_appointments.map((a: any) => (
                <div key={a.id} className="activity-item">
                  <div className="act-icon act-icon-brand">
                    <Calendar size={16} />
                  </div>
                  <div className="act-info flex-1 min-w-0">
                    <p>{a.patient_name}</p>
                    <div className="act-time">
                      {toJalali(a.date)} ساعت {a.time} - {a.doctor_name}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel card-iranian">
          <div className="panel-header panel-header-iranian">
            <h3 className="flex items-center gap-2">
              <Bell size={16} className="text-amber-500" />
              یادآوری‌ها
            </h3>
          </div>
          <div className="activity-list">
            {(!data?.reminders || data.reminders.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">یادآوری جدیدی وجود ندارد</p>
            ) : (
              data.reminders.map((r: any) => (
                <div key={r.id} className="activity-item">
                  <div className="act-icon act-icon-brand">
                    <Bell size={16} />
                  </div>
                  <div className="act-info flex-1 min-w-0">
                    <p>{r.patient_name}</p>
                    <div className="act-time">
                      {toJalali(r.date)} ساعت {r.time} - {r.doctor_name}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel card-iranian">
          <div className="panel-header panel-header-iranian">
            <h3 className="flex items-center gap-2">
              <Zap size={16} className="text-purple-500" />
              جلسات TMS / RTMS امروز
            </h3>
          </div>
          <div className="activity-list">
            {(!data?.today_tms || data.today_tms.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">جلسه TMS/RTMS برای امروز ثبت نشده</p>
            ) : (
              data.today_tms.map((t: any) => (
                <div key={t.id} className="activity-item">
                  <div className="act-icon act-icon-purple">
                    <Zap size={16} />
                  </div>
                  <div className="act-info flex-1 min-w-0">
                    <p>{t.patient_name}</p>
                    <div className="act-time flex items-center gap-2">
                      <span>{t.doctor_name}</span>
                      <span className="text-slate-300">|</span>
                      <span>{t.session_count} جلسه</span>
                      {t.protocol && <><span className="text-slate-300">|</span><span>{t.protocol}</span></>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel card-iranian">
          <div className="panel-header panel-header-iranian">
            <h3 className="flex items-center gap-2">
              <Calendar size={16} className="text-purple-500" />
              جلسات TMS / RTMS پیش رو
            </h3>
          </div>
          <div className="activity-list">
            {(!data?.upcoming_tms || data.upcoming_tms.length === 0) ? (
              <p className="text-xs text-slate-400 py-4 text-center">جلسه TMS/RTMS پیش رو وجود ندارد</p>
            ) : (
              data.upcoming_tms.map((t: any) => (
                <div key={t.id} className="activity-item">
                  <div className="act-icon act-icon-purple">
                    <Zap size={16} />
                  </div>
                  <div className="act-info flex-1 min-w-0">
                    <p>{t.patient_name}</p>
                    <div className="act-time flex items-center gap-2">
                      {toJalali(t.date)}
                      <span className="text-slate-300">|</span>
                      <span>{t.doctor_name}</span>
                      <span className="text-slate-300">|</span>
                      <span>{t.session_count} جلسه</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
