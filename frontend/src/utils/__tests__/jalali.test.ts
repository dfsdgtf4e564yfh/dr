import { describe, it, expect } from 'vitest'
import {
  toPersianDigits,
  toEnglishDigits,
  gregorianToJalali,
  toJalali,
  toJalaliNumeric,
  fromJalali,
  formatGregorian,
  nowJalali,
  nowGregorian,
  formatMoney,
  formatAge,
  numberToWords,
  escapeHtml,
  getWeekStartJalali,
  getWeekDaysJalali,
  JALALI_MONTH_NAMES,
  JALALI_DAY_NAMES,
} from '../jalali'

describe('toPersianDigits', () => {
  it('converts digits to Persian', () => {
    expect(toPersianDigits('123')).toBe('۱۲۳')
  })

  it('handles empty string', () => {
    expect(toPersianDigits('')).toBe('')
  })

  it('handles non-digit characters', () => {
    expect(toPersianDigits('abc 123')).toBe('abc ۱۲۳')
  })

  it('handles numbers', () => {
    expect(toPersianDigits(456)).toBe('۴۵۶')
  })
})

describe('toEnglishDigits', () => {
  it('converts Persian digits to English', () => {
    expect(toEnglishDigits('۱۲۳')).toBe('123')
  })

  it('handles mixed content', () => {
    expect(toEnglishDigits('abc ۱۲۳')).toBe('abc 123')
  })

  it('handles empty string', () => {
    expect(toEnglishDigits('')).toBe('')
  })
})

describe('gregorianToJalali', () => {
  it('converts 2024-03-20 (Nowruz)', () => {
    const [jy, jm, jd] = gregorianToJalali(2024, 3, 20)
    expect(jy).toBe(1403)
    expect(jm).toBe(1)
    expect(jd).toBe(1)
  })

  it('converts 2024-01-01 to 1402-10-11', () => {
    const [jy, jm, jd] = gregorianToJalali(2024, 1, 1)
    expect([jy, jm, jd]).toEqual([1402, 10, 11])
  })

  it('converts 2024-12-31', () => {
    const [jy, jm, jd] = gregorianToJalali(2024, 12, 31)
    expect([jy, jm, jd]).toEqual([1403, 10, 11])
  })
})

describe('jalaliToGregorian', () => {
  it('converts 1403-01-01 to 2024-03-20', () => {
    const result = fromJalali('1403/01/01')
    expect(result).toBe('2024-03-20')
  })

  it('converts 1398-01-01 correctly', () => {
    const result = fromJalali('1398/01/01')
    expect(result).toBe('2019-03-21')
  })
})

describe('toJalali', () => {
  it('converts ISO date to Jalali string', () => {
    expect(toJalali('2024-03-20')).toBe('۱۴۰۳/۰۱/۰۱')
  })

  it('handles null/empty', () => {
    expect(toJalali('')).toBe('')
    expect(toJalali(null as unknown as string)).toBe('')
    expect(toJalali(undefined as unknown as string)).toBe('')
  })

  it('handles ISO with time', () => {
    expect(toJalali('2024-03-20T10:30:00')).toBe('۱۴۰۳/۰۱/۰۱')
  })
})

describe('toJalaliNumeric', () => {
  it('converts to numeric Jalali without Persian digits', () => {
    expect(toJalaliNumeric('2024-03-20')).toBe('1403/01/01')
  })

  it('handles empty', () => {
    expect(toJalaliNumeric('')).toBe('')
  })
})

describe('fromJalali', () => {
  it('converts Jalali to Gregorian', () => {
    expect(fromJalali('1403/01/01')).toBe('2024-03-20')
  })

  it('handles empty', () => {
    expect(fromJalali('')).toBe('')
  })

  it('handles invalid input', () => {
    expect(fromJalali('invalid')).toBe('')
  })
})

describe('formatGregorian', () => {
  it('formats Date object to YYYY-MM-DD', () => {
    const d = new Date(2024, 2, 20)
    expect(formatGregorian(d)).toBe('2024-03-20')
  })
})

describe('nowJalali / nowGregorian', () => {
  it('nowGregorian returns formatted date', () => {
    const result = nowGregorian()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('nowJalali returns Jalali formatted date', () => {
    const result = nowJalali()
    expect(result).toMatch(/^[۰-۹]+\/[۰-۹]{2}\/[۰-۹]{2}$/)
  })
})

describe('formatMoney', () => {
  it('formats money with Persian digits and separators', () => {
    expect(formatMoney('1000000')).toBe('۱،۰۰۰،۰۰۰')
  })

  it('handles empty', () => {
    expect(formatMoney('')).toBe('')
    expect(formatMoney(null as unknown as string)).toBe('')
  })

  it('handles 0', () => {
    expect(formatMoney(0)).toBe('۰')
  })
})

describe('formatAge', () => {
  it('formats age with years', () => {
    expect(formatAge({ years: 30, months: 0, days: 0 })).toBe('۳۰ سال')
  })

  it('formats age with months', () => {
    expect(formatAge({ years: 0, months: 6, days: 0 })).toBe('۶ ماه')
  })

  it('formats age with days', () => {
    expect(formatAge({ years: 0, months: 0, days: 15 })).toBe('۱۵ روز')
  })

  it('formats full age', () => {
    expect(formatAge({ years: 25, months: 3, days: 10 })).toBe('۲۵ سال ۳ ماه ۱۰ روز')
  })

  it('handles number input', () => {
    expect(formatAge(30)).toBe('۳۰ سال')
  })

  it('handles null', () => {
    expect(formatAge(null as unknown as number)).toBe('')
  })
})

describe('numberToWords', () => {
  it('converts 0 to صفر', () => {
    expect(numberToWords(0)).toBe('صفر')
  })

  it('converts 1 to یک', () => {
    expect(numberToWords(1)).toBe('یک')
  })

  it('converts 10 to ده', () => {
    expect(numberToWords(10)).toBe('ده')
  })

  it('converts 25 to بیست پنج', () => {
    expect(numberToWords(25)).toBe('بیست پنج')
  })

  it('converts 100 to یکصد', () => {
    expect(numberToWords(100)).toBe('یکصد')
  })

  it('converts 1000 to یک هزار', () => {
    expect(numberToWords(1000)).toBe('یک هزار')
  })

  it('converts 12345 to twelve thousand three hundred forty five', () => {
    const result = numberToWords(12345)
    expect(result).toContain('هزار')
  })

  it('handles negative numbers', () => {
    expect(numberToWords(-5)).toBe('منفی پنج')
  })

  it('converts 11 to یازده', () => {
    expect(numberToWords(11)).toBe('یازده')
  })

  it('converts 21 to بیست یک', () => {
    expect(numberToWords(21)).toBe('بیست یک')
  })
})

describe('escapeHtml', () => {
  it('escapes HTML characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('handles null', () => {
    expect(escapeHtml(null as unknown as string)).toBe('')
  })

  it('handles empty', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('getWeekStartJalali / getWeekDaysJalali', () => {
  it('getWeekStartJalali returns a Date', () => {
    const result = getWeekStartJalali(new Date(2024, 2, 20))
    expect(result instanceof Date).toBe(true)
  })

  it('getWeekDaysJalali returns 7 dates', () => {
    const start = getWeekStartJalali(new Date(2024, 2, 20))
    const days = getWeekDaysJalali(start)
    expect(days).toHaveLength(7)
    days.forEach(d => expect(d instanceof Date).toBe(true))
  })
})

describe('constants', () => {
  it('has 12 Jalali month names', () => {
    expect(JALALI_MONTH_NAMES).toHaveLength(12)
  })

  it('has 7 Jalali day names', () => {
    expect(JALALI_DAY_NAMES).toHaveLength(7)
  })
})
