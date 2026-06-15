const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

export function toPersianDigits(str: string | number): string {
  return String(str).replace(/\d/g, d => PERSIAN_DIGITS[+d])
}

export function formatAge(ageObj: { years: number; months: number; days: number } | number | null | undefined): string {
  if (!ageObj) return ''
  if (typeof ageObj === 'number') return toPersianDigits(ageObj) + ' سال'
  const { years, months, days } = ageObj
  const parts: string[] = []
  if (years > 0) parts.push(toPersianDigits(years) + ' سال')
  if (months > 0) parts.push(toPersianDigits(months) + ' ماه')
  if (days > 0 || parts.length === 0) parts.push(toPersianDigits(days) + ' روز')
  return parts.join(' ')
}

export function formatMoney(str: string | number | null | undefined): string {
  if (!str && str !== 0) return ''
  const num = str.toString().replace(/[^0-9]/g, '')
  if (!num) return ''
  return toPersianDigits(num.replace(/\B(?=(\d{3})+(?!\d))/g, '،'))
}

export function formatMoneyCompact(str: string | number | null | undefined): string {
  if (!str && str !== 0) return ''
  const num = str.toString().replace(/[^0-9]/g, '')
  if (!num) return ''
  const n = parseInt(num, 10)
  const billion = 1000000000
  const million = 1000000
  const thousand = 1000
  if (n >= billion) {
    const v = (n / billion).toFixed(1).replace(/\.0$/, '')
    return `${toPersianDigits(v)} میلیارد`
  }
  if (n >= million) {
    const v = (n / million).toFixed(1).replace(/\.0$/, '')
    return `${toPersianDigits(v)} میلیون`
  }
  if (n >= thousand) {
    const v = (n / thousand).toFixed(1).replace(/\.0$/, '')
    return `${toPersianDigits(v)} هزار`
  }
  return toPersianDigits(num)
}

export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export function smartPersianDigits(str: string | number): string {
  const s = String(str)
  // اگر حرف انگلیسی بین دو عدد باشه (مثل E18C34E7)، کل اعداد انگلیسی بمونن
  if (/[0-9][a-zA-Z][0-9]/.test(s)) return s
  return toPersianDigits(s)
}

export function toEnglishDigits(str: string | number): string {
  return String(str).replace(/[۰-۹]/g, d => ENGLISH_DIGITS[PERSIAN_DIGITS.indexOf(d)])
}

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let gy2 = (gm > 2) ? (gy + 1) : gy
  let days = 355666 + (365 * gy) + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) + gd + gdm[gm - 1]
  let jy = -1595 + (33 * ~~(days / 12053))
  days %= 12053
  jy += 4 * ~~(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += ~~((days - 1) / 365)
    days = (days - 1) % 365
  }
  let jm = (days < 186) ? 1 + ~~(days / 31) : 7 + ~~((days - 186) / 30)
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30))
  return [jy, jm, jd]
}

function isLeapGregorian(gy: number): boolean {
  return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0
}

const GREG_MONTH_DAYS_LEAP = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]
const GREG_MONTH_DAYS_COMMON = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let jy1 = jy + 1595
  let days = -355668 + (365 * jy1) + (~~(jy1 / 33) * 8) + ~~(((jy1 % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186)
  let gy = 400 * ~~(days / 146097)
  days %= 146097
  if (days > 36524) {
    gy += 100 * ~~(--days / 36524)
    days %= 36524
    if (days >= 365) days++
  }
  gy += 4 * ~~(days / 1461)
  days %= 1461
  if (days > 365) {
    gy += ~~((days - 1) / 365)
    days = (days - 1) % 365
  }
  const monthOffsets = isLeapGregorian(gy) ? GREG_MONTH_DAYS_LEAP : GREG_MONTH_DAYS_COMMON
  let gm = 1
  for (let i = 1; i <= 11; i++) {
    if (days >= monthOffsets[i]) gm = i + 1
  }
  let gd = 1 + days - monthOffsets[gm - 1]
  return [gy, gm, gd]
}

export function toJalali(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const dateOnly = String(dateStr).split(' ')[0].split('T')[0]
  const parts = dateOnly.split('-')
  if (parts.length !== 3) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return toJalali(formatGregorian(d))
  }
  const [jy, jm, jd] = gregorianToJalali(+parts[0], +parts[1], +parts[2])
  return `${toPersianDigits(jy)}/${toPersianDigits(String(jm).padStart(2, '0'))}/${toPersianDigits(String(jd).padStart(2, '0'))}`
}

export function toJalaliNumeric(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return toJalaliNumeric(formatGregorian(d))
  }
  const [jy, jm, jd] = gregorianToJalali(+parts[0], +parts[1], +parts[2])
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
}

export function fromJalali(jalaliStr: string): string {
  if (!jalaliStr) return ''
  const cleaned = toEnglishDigits(jalaliStr)
  const parts = cleaned.split(/[/\s-]/)
  if (parts.length !== 3) return ''
  const [gy, gm, gd] = jalaliToGregorian(+parts[0], +parts[1], +parts[2])
  const d = new Date(gy, gm - 1, gd)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatGregorian(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function nowJalali(): string {
  const d = new Date()
  return toJalali(formatGregorian(d))
}

export function nowGregorian(): string {
  return formatGregorian(new Date())
}

export function getWeekStartJalali(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - ((day + 1) % 7)
  d.setDate(diff)
  return d
}

export function getWeekDaysJalali(weekStart: Date): Date[] {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export const JALALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

export const JALALI_DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

export function getPersianMonthName(month: number): string {
  return JALALI_MONTH_NAMES[month - 1] || ''
}

export const PERSIAN_MONTHS = JALALI_MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }))

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده']
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const HUNDREDS = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد']
const THOUSAND_POWERS = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون']

function threeDigitToWords(n: number): string {
  const h = Math.floor(n / 100)
  const t = Math.floor((n % 100) / 10)
  const o = n % 10
  let result = ''
  if (h > 0) result += HUNDREDS[h] + ' '
  if (t === 1) {
    result += TEENS[o] + ' '
  } else {
    if (t > 0) result += TENS[t] + ' '
    if (o > 0) result += ONES[o] + ' '
  }
  return result.trim()
}

export function numberToWords(num: number): string {
  if (num === 0) return 'صفر'
  if (num < 0) return 'منفی ' + numberToWords(Math.abs(num))
  let n = num
  let result = ''
  let power = 0
  while (n > 0) {
    const part = n % 1000
    if (part > 0) {
      const words = threeDigitToWords(part)
      result = words + ' ' + THOUSAND_POWERS[power] + ' ' + result
    }
    n = Math.floor(n / 1000)
    power++
  }
  return result.trim()
}

export function formatPhone(phone: string | number | null | undefined): string {
  if (!phone) return ''
  const cleaned = toEnglishDigits(phone).replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    const formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
    return toPersianDigits(formatted)
  }
  return toPersianDigits(phone)
}

export function formatNationalId(nid: string | number | null | undefined): string {
  if (!nid) return ''
  const cleaned = toEnglishDigits(nid).replace(/\D/g, '')
  if (cleaned.length === 10) {
    const formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 9)}-${cleaned.slice(9)}`
    return toPersianDigits(formatted)
  }
  return toPersianDigits(nid)
}

export function formatGender(gender: string | null | undefined): string {
  if (!gender) return '—'
  if (gender === 'male' || gender === 'm') return 'آقا'
  if (gender === 'female' || gender === 'f') return 'خانم'
  return gender
}

export function formatInsurance(ins: string | null | undefined): string {
  if (!ins) return '—'
  const map: Record<string, string> = {
    none: 'ندارد',
    social_security: 'تأمین اجتماعی',
    health_services: 'خدمات درمانی',
    military: 'نیروهای مسلح',
    other: 'سایر',
  }
  return map[ins] || ins
}
