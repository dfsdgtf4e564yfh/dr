export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

export const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
export const FULL_WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

const IRANIAN_HOLIDAYS: Record<string, { name: string; type: 'national' | 'religious' }> = {
  '1-1': { name: 'جشن نوروز', type: 'national' },
  '1-2': { name: 'عید نوروز', type: 'national' },
  '1-3': { name: 'عید نوروز', type: 'national' },
  '1-4': { name: 'عید نوروز', type: 'national' },
  '1-12': { name: 'روز جمهوری اسلامی', type: 'national' },
  '1-13': { name: 'روز طبیعت', type: 'national' },
  '3-14': { name: 'رحلت امام خمینی', type: 'religious' },
  '3-15': { name: 'قیام ۱۵ خرداد', type: 'national' },
  '11-22': { name: 'پیروزی انقلاب اسلامی', type: 'national' },
  '12-29': { name: 'روز ملی شدن صنعت نفت', type: 'national' },
}

export interface CalendarDay {
  day: number
  month: number
  year: number
  isToday: boolean
  isHoliday: boolean
  holidayName?: string
  appointments?: number
}

export interface PersianMonthData {
  year: number
  month: number
  monthName: string
  days: CalendarDay[]
  firstWeekday: number
  totalDays: number
}

export function getPersianMonthName(month: number): string {
  return PERSIAN_MONTHS[month - 1] || ''
}

export function isPersianHoliday(month: number, day: number): { isHoliday: boolean; name?: string } {
  const key = `${month}-${day}`
  const holiday = IRANIAN_HOLIDAYS[key]
  return holiday ? { isHoliday: true, name: holiday.name } : { isHoliday: false }
}

function persianToGregorian(py: number, pm: number, pd: number): Date {
  const persianEpoch = 1948320
  let ep: number
  if (py >= 1395) {
    ep = (py - 1395) * 365
    for (let i = 0; i < (py - 1395); i++) {
      const y = 1395 + i
      if ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ep++
    }
    const monthDays = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]
    if (((py - 1) % 4 === 0 && (py - 1) % 100 !== 0) || (py - 1) % 400 === 0) monthDays[12] = 30
    for (let i = 1; i < pm; i++) ep += monthDays[i]
    ep += pd - 1
    const base = new Date(2016, 2, 19)
    return new Date(base.getTime() + ep * 86400000)
  }
  return new Date()
}

export function getPersianMonthData(year: number, month: number): PersianMonthData {
  const firstDay = persianToGregorian(year, month, 1)
  let firstWeekday = firstDay.getDay() - 6
  if (firstWeekday < 0) firstWeekday += 7

  const monthDays = [31, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30]
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) monthDays[11] = 30
  const totalDays = monthDays[month - 1]

  const today = new Date()
  const todayStr = today.toLocaleDateString('fa-IR').split('/')

  const days: CalendarDay[] = []
  for (let d = 1; d <= totalDays; d++) {
    const holiday = isPersianHoliday(month, d)
    days.push({
      day: d,
      month,
      year,
      isToday: Number(todayStr[0]) === year && Number(todayStr[1]) === month && Number(todayStr[2]) === d,
      isHoliday: holiday.isHoliday || (firstWeekday + d - 1) % 7 === 6,
      holidayName: holiday.name,
    })
  }

  return { year, month, monthName: PERSIAN_MONTHS[month - 1], days, firstWeekday, totalDays }
}
