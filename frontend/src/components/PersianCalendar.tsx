import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPersianMonthData, WEEKDAYS, type PersianMonthData, type CalendarDay } from '../utils/persian_calendar'
import { toPersianDigits, gregorianToJalali, jalaliToGregorian, formatGregorian } from '../utils/jalali'

interface PersianCalendarProps {
  year?: number
  month?: number
  onDateSelect?: (date: { year: number; month: number; day: number; gregorian: string }) => void
  onMonthChange?: (year: number, month: number) => void
  appointments?: { date: string; count: number; status?: string }[]
  compact?: boolean
}

export default function PersianCalendar({ year: propYear, month: propMonth, onDateSelect, onMonthChange, appointments, compact }: PersianCalendarProps) {
  const now = new Date()
  const [ty, tm, td] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const [year, setYear] = useState(propYear || ty)
  const [month, setMonth] = useState(propMonth || tm)

  useEffect(() => {
    if (propYear !== undefined && propYear !== year) setYear(propYear)
  }, [propYear])

  useEffect(() => {
    if (propMonth !== undefined && propMonth !== month) setMonth(propMonth)
  }, [propMonth])

  const data = getPersianMonthData(year, month)

  const prevMonth = () => {
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    setMonth(m); setYear(y)
    onMonthChange?.(y, m)
  }

  const nextMonth = () => {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    setMonth(m); setYear(y)
    onMonthChange?.(y, m)
  }

  const goToday = () => {
    setYear(ty); setMonth(tm)
    onMonthChange?.(ty, tm)
  }

  const weekStart = 6
  const weekDays = [...WEEKDAYS.slice(6), ...WEEKDAYS.slice(0, 6)]

  const grid: (CalendarDay | null)[][] = []
  let row: (CalendarDay | null)[] = []
  for (let i = 0; i < data.firstWeekday; i++) row.push(null)
  for (const day of data.days) {
    row.push(day)
    if (row.length === 7) { grid.push(row); row = [] }
  }
  if (row.length > 0) { while (row.length < 7) row.push(null); grid.push(row) }

  const appointmentCount = (day: number, month: number, year: number): number => {
    if (!appointments) return 0
    const [gy, gm, gd] = jalaliToGregorian(year, month, day)
    const dateStr = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`
    return appointments.filter(a => {
      const aDate = a.date.split('T')[0]
      return aDate === dateStr
    }).reduce((sum, a) => sum + a.count, 0)
  }

  return (
    <div className={`bg-white rounded-2xl border border-surface-200 overflow-hidden ${compact ? '' : 'shadow-sm'}`}>
      <div className="flex items-center justify-between p-3 bg-surface-50/80 border-b border-surface-100">
        <button onClick={prevMonth} className="p-1.5 hover:bg-surface-200 rounded-xl transition-all"><ChevronLeft size={18} /></button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-surface-800">{data.monthName}</span>
          <span className="text-surface-400 font-medium">{toPersianDigits(year)}</span>
          <button onClick={goToday} className="text-[10px] text-brand-500 hover:text-brand-600 font-semibold px-2 py-1 rounded-lg hover:bg-brand-50 transition-all">
            امروز
          </button>
        </div>
        <button onClick={nextMonth} className="p-1.5 hover:bg-surface-200 rounded-xl transition-all"><ChevronRight size={18} /></button>
      </div>

      <div className="p-2">
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((d, i) => (
            <div key={i} className={`text-center text-[10px] font-bold py-1 ${i === 6 ? 'text-rose-500' : 'text-surface-400'}`}>
              {d}
            </div>
          ))}
        </div>

        {grid.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => (
              <div key={di} className="aspect-square p-0.5">
                {day ? (
                  <button
                    onClick={() => {
                      if (onDateSelect) {
                        const [gy, gm, gd] = jalaliToGregorian(day.year, day.month, day.day)
                        const g = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`
                        onDateSelect({ year: day.year, month: day.month, day: day.day, gregorian: g })
                      }
                    }}
                    className={`w-full h-full rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all ${
                      day.isToday
                        ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                        : day.isHoliday
                          ? 'text-rose-500 hover:bg-rose-50'
                          : 'text-surface-700 hover:bg-surface-50'
                    }`}>
                    <span>{toPersianDigits(day.day)}</span>
                    {day.holidayName && compact && <span className="text-[6px] leading-none">•</span>}
                    {appointmentCount(day.day, day.month, day.year) > 0 && (
                      <span className="text-[7px] mt-0.5 opacity-70">
                        {toPersianDigits(appointmentCount(day.day, day.month, day.year))}
                      </span>
                    )}
                  </button>
                ) : <div />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
