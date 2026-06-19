interface HolidayEvent {
  month: number
  day: number
  title: string
  type: string
  icon?: string
}

const HOLIDAYS: HolidayEvent[] = [
  { month: 1, day: 1, title: 'نوروز - جشن سال نو', type: 'national' },
  { month: 1, day: 2, title: 'عید نوروز', type: 'national' },
  { month: 1, day: 3, title: 'عید نوروز', type: 'national' },
  { month: 1, day: 4, title: 'عید نوروز', type: 'national' },
  { month: 1, day: 12, title: 'روز جمهوری اسلامی', type: 'national' },
  { month: 1, day: 13, title: 'سیزده‌بدر', type: 'national' },
  { month: 3, day: 14, title: 'رحلت امام خمینی', type: 'national' },
  { month: 3, day: 15, title: 'قیام ۱۵ خرداد', type: 'national' },
  { month: 11, day: 22, title: 'پیروزی انقلاب اسلامی', type: 'national' },
  { month: 12, day: 29, title: 'روز ملی شدن صنعت نفت', type: 'national' },
]

const MOVEABLE_HOLIDAYS: { title: string; type: string }[] = [
  { title: 'تاسوعای حسینی', type: 'religious' },
  { title: 'عاشورای حسینی', type: 'religious' },
  { title: 'اربعین حسینی', type: 'religious' },
  { title: 'رحلت پیامبر اکرم (ص)', type: 'religious' },
  { title: 'شهادت امام حسن مجتبی (ع)', type: 'religious' },
  { title: 'شهادت امام رضا (ع)', type: 'religious' },
  { title: 'شهادت امام حسن عسکری (ع)', type: 'religious' },
  { title: 'ولادت پیامبر اکرم (ص) و امام صادق (ع)', type: 'religious' },
  { title: 'شهادت حضرت فاطمه (س)', type: 'religious' },
  { title: 'ولادت حضرت علی (ع)', type: 'religious' },
  { title: 'بعثت پیامبر اکرم (ص)', type: 'religious' },
  { title: 'ولادت حضرت مهدی (عج)', type: 'religious' },
  { title: 'شهادت حضرت علی (ع)', type: 'religious' },
  { title: 'شهادت امام جعفر صادق (ع)', type: 'religious' },
  { title: 'عید سعید قربان', type: 'religious' },
  { title: 'عید سعید غدیر', type: 'religious' },
  { title: 'عید سعید فطر', type: 'religious' },
  { title: 'روز عرفه', type: 'religious' },
]

const ANCIENT_EVENTS: HolidayEvent[] = [
  { month: 1, day: 1, title: 'جشن نوروز', type: 'ancient', icon: '' },
  { month: 1, day: 13, title: 'جشن سیزده‌بدر', type: 'ancient', icon: '' },
  { month: 2, day: 1, title: 'جشن گیاه‌آوری', type: 'ancient', icon: '' },
  { month: 3, day: 6, title: 'خردادگان', type: 'ancient', icon: '' },
  { month: 4, day: 1, title: 'جشن آب‌پاشون (تیرگان)', type: 'ancient', icon: '' },
  { month: 4, day: 13, title: 'تیرگان', type: 'ancient', icon: '' },
  { month: 5, day: 7, title: 'جشن مردادگان', type: 'ancient', icon: '' },
  { month: 6, day: 16, title: 'جشن شهریورگان', type: 'ancient', icon: '' },
  { month: 7, day: 1, title: 'جشن میتراکانا (مهرگان)', type: 'ancient', icon: '' },
  { month: 7, day: 10, title: 'مهرگان', type: 'ancient', icon: '' },
  { month: 8, day: 1, title: 'جشن آبانگان', type: 'ancient', icon: '' },
  { month: 9, day: 1, title: 'جشن آذرگان', type: 'ancient', icon: '' },
  { month: 10, day: 1, title: 'جشن دیگان', type: 'ancient', icon: '' },
  { month: 10, day: 5, title: 'شب یلدا (چله)', type: 'ancient', icon: '' },
  { month: 10, day: 30, title: 'جشن سده', type: 'ancient', icon: '' },
  { month: 11, day: 1, title: 'جشن بهمنگان', type: 'ancient', icon: '' },
  { month: 12, day: 5, title: 'جشن اسفندگان (سپندارمذگان)', type: 'ancient', icon: '' },
  { month: 12, day: 19, title: 'جشن فروردینگان', type: 'ancient', icon: '' },
  { month: 12, day: 23, title: 'چهارشنبه‌سوری', type: 'ancient', icon: '' },
  { month: 12, day: 29, title: 'جشن پایان سال', type: 'ancient', icon: '' },
]

export function getHolidaysForDate(jy: number, jm: number, jd: number): HolidayEvent[] {
  const result: HolidayEvent[] = []
  const hol = HOLIDAYS.find(h => h.month === jm && h.day === jd)
  if (hol) result.push(hol)
  const ancient = ANCIENT_EVENTS.find(h => h.month === jm && h.day === jd)
  if (ancient) result.push(ancient)
  return result
}

export function isHoliday(jy: number, jm: number, jd: number): boolean {
  return getDayOfWeek(jy, jm, jd) === 6
}

export function getDayOfWeek(jy: number, jm: number, jd: number): number {
  const g = jalaliToGregorianFixed(jy, jm, jd)
  const d = new Date(g[0], g[1] - 1, g[2])
  return (d.getDay() + 1) % 7
}

function isLeapGregorian(gy: number): boolean {
  return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0
}

function jalaliToGregorianFixed(jy: number, jm: number, jd: number): [number, number, number] {
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
  const monthOffsets = isLeapGregorian(gy) ? [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335] : [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let gm = 1
  for (let i = 1; i <= 11; i++) {
    if (days >= monthOffsets[i]) gm = i + 1
  }
  let gd = 1 + days - monthOffsets[gm - 1]
  return [gy, gm, gd]
}

export { HOLIDAYS, ANCIENT_EVENTS }
