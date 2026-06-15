const CITY_CODES: Record<string, string> = {}

function _build() {
  const raw: [string[], string][] = [
    [['169'], 'آذرشهر'],
    [['170'], 'اسکو'],
    [['149','150'], 'اهر'],
    [['171'], 'بستان آباد'],
    [['168'], 'بناب'],
    [['136','137','138'], 'تبریز'],
    [['545'], 'ترکمانچای'],
    [['505'], 'جلفا'],
    [['636'], 'چاروایماق'],
    [['164','165'], 'سراب'],
    [['172'], 'شبستر'],
    [['623'], 'صوفیان'],
    [['506'], 'عجب شیر'],
    [['519'], 'کلیبر'],
    [['154','155'], 'مراغه'],
    [['567'], 'ورزقان'],
    [['173'], 'هریس'],
    [['159','160'], 'هشترود'],
    [['604'], 'هوراند'],
    [['274','275'], 'ارومیه'],
    [['295'], 'اشنویه'],
    [['637'], 'انزل'],
    [['292'], 'بوکان'],
    [['492'], 'پلدشت'],
    [['289'], 'پیرانشهر'],
    [['677'], 'تخت سلیمان'],
  ]

  for (const [codes, city] of raw) {
    for (const c of codes) {
      CITY_CODES[c] = city
    }
  }
}

_build()

export function getCityFromNationalId(nationalId: string): string | null {
  if (!nationalId || nationalId.length < 3) return null
  const code = nationalId.substring(0, 3)
  return CITY_CODES[code] || null
}
