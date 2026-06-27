import { gregorianToJalali, jalaliToGregorian, formatGregorian } from './jalali'

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

export function getPersianMonthData(year: number, month: number): PersianMonthData {
  const [gy, gm, gd] = jalaliToGregorian(year, month, 1)
  const firstDay = new Date(gy, gm - 1, gd)
  let firstWeekday = firstDay.getDay() - 6
  if (firstWeekday < 0) firstWeekday += 7

  const monthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]
  const isLeap = ((((year + 12) % 33) % 4) === 1)
  if (isLeap) monthLengths[11] = 30
  const totalDays = monthLengths[month - 1]

  const [ty, tm, td] = gregorianToJalali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())

  const days: CalendarDay[] = []
  for (let d = 1; d <= totalDays; d++) {
    const holiday = isPersianHoliday(month, d)
    const dayOfWeek = (firstWeekday + d - 1) % 7
    days.push({
      day: d,
      month,
      year,
      isToday: ty === year && tm === month && td === d,
      isHoliday: holiday.isHoliday || dayOfWeek === 6,
      holidayName: holiday.name,
    })
  }

  return { year, month, monthName: PERSIAN_MONTHS[month - 1], days, firstWeekday, totalDays }
}
