import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { ChevronRight, ChevronLeft, CalendarDays, X, Clock, XCircle } from 'lucide-react'
import { getCalendarAppointments } from '../services/api'
import {
  toJalali, toJalaliNumeric, formatGregorian, toPersianDigits,
  getWeekStartJalali, getWeekDaysJalali, JALALI_DAY_NAMES, JALALI_MONTH_NAMES
} from '../utils/jalali'
import type { Appointment } from '../types'

const statusColors: Record<string, string> = {
  scheduled: 'bg-brand-100 border-brand-300 text-brand-700',
  completed: 'bg-green-100 border-green-300 text-green-700',
  cancelled: 'bg-red-100 border-red-300 text-red-700 line-through',
  rescheduled: 'bg-amber-100 border-amber-300 text-amber-700',
}

function getIranNow() {
  const d = new Date()
  const offset = 3.5 * 60
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000 + offset * 60000)
}

function getAppointmentDiff(timeStr: string) {
  const parts = timeStr.split(':')
  const h = parseInt(parts[0]) || 0
  const m = parseInt(parts[1]) || 0
  const now = getIranNow()
  const apt = new Date(now)
  apt.setHours(h, m, 0, 0)
  return (apt.getTime() - now.getTime()) / 60000
}

export default function AppointmentsCalendar() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStartJalali(new Date()))
  const [apps, setApps] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const formatDate = (d: Date) => formatGregorian(d)
  const todayStr = formatDate(new Date())

  const loadWeek = async () => {
    setLoading(true)
    try {
      const res = await getCalendarAppointments(formatDate(weekStart))
      const data = res.data as any
      setApps(Array.isArray(data) ? data : data.appointments || [])
    } catch { toast.error('متأسفانه در دریافت تقویم خطایی رخ داد', { icon: <XCircle size={20} /> }) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadWeek() }, [weekStart])

  const todayApps = apps.filter(a => a.date === todayStr)

  const goPrev = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
    setSelectedDate(null)
  }

  const goNext = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
    setSelectedDate(null)
  }

  const goToday = () => {
    setWeekStart(getWeekStartJalali(new Date()))
    setSelectedDate(null)
  }

  const getWeekDays = () => getWeekDaysJalali(weekStart)

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = formatDate(date)
    return apps.filter(a => a.date === dateStr)
  }

  const statusLabel: Record<string, string> = {
    scheduled: 'نوبت', completed: 'انجام شده', cancelled: 'لغو', rescheduled: 'تغییر'
  }

  const formatWeekRange = () => {
    const start = toJalaliNumeric(formatDate(weekStart))
    const endDate = new Date(weekStart)
    endDate.setDate(endDate.getDate() + 6)
    const end = toJalaliNumeric(formatDate(endDate))
    return `${toPersianDigits(start)} — ${toPersianDigits(end)}`
  }

  const selectDay = (date: Date) => {
    const ds = formatDate(date)
    setSelectedDate(selectedDate === ds ? null : ds)
  }

  const selectedApps = selectedDate ? apps.filter(a => a.date === selectedDate) : []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-extrabold text-slate-800">تقویم نوبت‌ها</h1>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="btn-secondary text-sm">امروز</button>
          <button onClick={goPrev} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"><ChevronRight size={20} /></button>
          <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center">{formatWeekRange()}</span>
          <button onClick={goNext} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"><ChevronLeft size={20} /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" /></div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-7 gap-[3px] min-w-[650px]">
          {getWeekDays().map((day, idx) => {
            const dayApps = getAppointmentsForDay(day)
            const isToday = formatDate(day) === todayStr
            const isSelected = formatDate(day) === selectedDate
            const jDate = toJalaliNumeric(formatDate(day))
            const jDay = jDate.split('/')[2]
            return (
              <div
                key={idx}
                onClick={() => selectDay(day)}
                className={`bg-white rounded-xl min-h-[72px] cursor-pointer hover:shadow-md transition-shadow relative ${
                  isSelected
                    ? 'border-2 border-amber-400 p-[3px]'
                    : isToday
                      ? 'border-2 border-brand-500 p-[3px]'
                      : 'border border-slate-200 p-1'
                }`}
              >
                <div className="text-center mb-0.5 pb-0.5 border-b border-slate-100">
                  <p className={`text-[11px] font-bold ${isToday ? 'text-brand-500' : 'text-slate-600'}`}>
                    {toPersianDigits(jDay)} {JALALI_DAY_NAMES[idx]}
                  </p>
                </div>
                <div className="space-y-[2px]">
                  {dayApps.length === 0 ? (
                    <p className="text-[10px] text-slate-300 text-center py-1">—</p>
                  ) : dayApps.slice(0, 2).map(a => {
                    const past = a.status === 'scheduled' && isToday && getAppointmentDiff(a.time) < 0
                    const soon = a.status === 'scheduled' && isToday && getAppointmentDiff(a.time) > 0 && getAppointmentDiff(a.time) <= 60
                    return (
                      <div key={a.id} className={`text-[9px] p-0.5 rounded border ${past ? 'bg-slate-50 border-slate-200 text-slate-400 line-through' : soon ? 'bg-amber-50 border-amber-200 text-amber-700' : statusColors[a.status] || 'bg-slate-50'}`}>
                        <p className="font-medium">{a.time}</p>
                        <p className="truncate">{a.patient_name}</p>
                      </div>
                    )
                  })}
                  {dayApps.length > 2 && (
                    <p className="text-[9px] text-slate-400 text-center">+{toPersianDigits(dayApps.length - 2)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>
      )}

      {selectedDate && (
        <div className="panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-slate-700">نوبت‌های {toPersianDigits(toJalaliNumeric(selectedDate))}</h2>
              <span className="text-xs text-slate-400">({toPersianDigits(selectedApps.length)})</span>
            </div>
            <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {selectedApps.length === 0 ? (
              <p className="text-xs text-slate-300 text-center py-6">نوبتی برای این تاریخ وجود ندارد</p>
            ) : selectedApps.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'completed' ? 'bg-green-500' : a.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <span className="text-xs font-mono text-slate-500 min-w-[40px]">{a.time}</span>
                <span className="text-sm text-slate-800 font-medium">{a.patient_name}</span>
                <span className="text-xs text-slate-400">{a.doctor_name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[a.status]}`}>
                  {statusLabel[a.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <CalendarDays size={16} className="text-brand-500" />
          <h2 className="text-sm font-bold text-slate-700">نوبت‌های امروز</h2>
          <span className="text-xs text-slate-400">({toPersianDigits(todayApps.length)})</span>
        </div>
        <div className="divide-y divide-slate-50">
          {todayApps.length === 0 ? (
            <p className="text-xs text-slate-300 text-center py-6">نوبتی برای امروز وجود ندارد</p>
          ) : todayApps.map(a => {
            const past = a.status === 'scheduled' && getAppointmentDiff(a.time) < 0
            const soon = a.status === 'scheduled' && getAppointmentDiff(a.time) > 0 && getAppointmentDiff(a.time) <= 60
            return (
              <div key={a.id} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${past ? 'opacity-50' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${a.status === 'completed' ? 'bg-green-500' : a.status === 'cancelled' ? 'bg-red-500' : soon ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'}`} />
                <span className={`text-xs font-mono min-w-[40px] ${past ? 'text-slate-300 line-through' : 'text-slate-500'}`}>{a.time}</span>
                <span className={`text-sm font-medium ${past ? 'text-slate-400' : 'text-slate-800'}`}>{a.patient_name}</span>
                <span className="text-xs text-slate-400">{a.doctor_name}</span>
                {soon && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                    <Clock size={11} /> به زودی
                  </span>
                )}
                {past && a.status === 'scheduled' && (
                  <span className="text-[10px] text-slate-400 font-medium">گذشته</span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[a.status]}`}>
                  {statusLabel[a.status]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
