import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Plus } from 'lucide-react'
import { getAppointments } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toPersianDigits, toJalali, getPersianMonthName } from '../utils/jalali'
import PersianCalendar from '../components/PersianCalendar'
import StatusBadge from '../components/StatusBadge'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'

export default function PersianCalendarPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<any[]>([])
  const [currentYear, setCurrentYear] = useState<number>(0)
  const [currentMonth, setCurrentMonth] = useState<number>(0)

  useEffect(() => {
    const today = new Date().toLocaleDateString('fa-IR').split('/')
    setCurrentYear(Number(today[0]))
    setCurrentMonth(Number(today[1]))
    loadAppointments()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      setSelectedDayAppointments(appointments.filter(a => {
        const aDate = a.date?.split('T')[0]
        return aDate === selectedDate
      }))
    }
  }, [selectedDate, appointments])

  const loadAppointments = async () => {
    try {
      const { data } = await getAppointments({ page_size: 500 })
      setAppointments(Array.isArray(data) ? data : data.results || [])
    } catch { /* ignore */ }
  }

  const handleDateSelect = (date: { year: number; month: number; day: number }) => {
    const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }

  const monthStats = appointments.filter(a => {
    const d = a.date?.split('T')[0]
    if (!d) return false
    const parts = d.split('-')
    return Number(parts[0]) === currentYear && Number(parts[1]) === currentMonth
  })

  const counts = {
    total: monthStats.length,
    completed: monthStats.filter(a => a.status === 'completed').length,
    scheduled: monthStats.filter(a => a.status === 'scheduled').length,
    cancelled: monthStats.filter(a => a.status === 'cancelled').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader title="تقویم شمسی">
        {hasPermission('appointments') && (
           <Button onClick={() => navigate('/panel/appointments')} variant="primary" icon={List}>مدیریت نوبت‌ها</Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PersianCalendar
            onDateSelect={handleDateSelect}
            onMonthChange={(y, m) => { setCurrentYear(y); setCurrentMonth(m) }}
            appointments={appointments.map(a => ({ date: a.date, count: 1, status: a.status }))}
          />
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-bold text-surface-700 text-sm mb-3">
              آمار {getPersianMonthName(currentMonth)}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="stat-card p-3 text-center">
                <div className="text-lg font-extrabold text-brand-600">{toPersianDigits(counts.total)}</div>
                <div className="text-[10px] text-surface-400">کل نوبت‌ها</div>
              </div>
              <div className="stat-card p-3 text-center">
                <div className="text-lg font-extrabold text-success-600">{toPersianDigits(counts.completed)}</div>
                <div className="text-[10px] text-surface-400">انجام شده</div>
              </div>
              <div className="stat-card p-3 text-center">
                <div className="text-lg font-extrabold text-amber-500">{toPersianDigits(counts.scheduled)}</div>
                <div className="text-[10px] text-surface-400">برنامه‌ریزی</div>
              </div>
              <div className="stat-card p-3 text-center">
                <div className="text-lg font-extrabold text-rose-500">{toPersianDigits(counts.cancelled)}</div>
                <div className="text-[10px] text-surface-400">لغو شده</div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-surface-700 text-sm">
                {selectedDate ? toJalali(selectedDate) : 'نوبت‌های امروز'}
              </h3>
              {selectedDate && (
                <button onClick={() => navigate(`/panel/appointments?date=${selectedDate}`)} className="text-xs text-brand-500 hover:text-brand-600">
                  <Plus size={14} className="inline" /> نوبت جدید
                </button>
              )}
            </div>
            {selectedDayAppointments.length === 0 ? (
              <p className="text-xs text-surface-400 text-center py-4">نوبتی در این تاریخ وجود ندارد</p>
            ) : (
              <div className="space-y-2">
                {selectedDayAppointments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2.5 bg-surface-50 rounded-xl">
                    <div>
                      <div className="text-sm font-medium text-surface-700">{a.patient_name}</div>
                      <div className="text-xs text-surface-400">{toPersianDigits(a.time)} - {a.treatment_name}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
