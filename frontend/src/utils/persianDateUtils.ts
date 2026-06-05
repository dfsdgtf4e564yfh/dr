/**
 * Persian Date & Number Utilities - ابزارهای تاریخ فارسی و اعداد
 * با توجه به تمدن کهن ایران و استانداردهای حرفه‌ای
 */

// اعداد فارسی
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * تبدیل اعداد انگلیسی به فارسی
 * @param {number | string} num - عدد
 * @returns {string} - عدد به فارسی
 */
export const toPersianNumber = (num: number | string): string => {
  const str = String(num);
  return str.replace(/\d/g, (digit) => PERSIAN_DIGITS[parseInt(digit)]);
};

/**
 * تبدیل اعداد فارسی به انگلیسی
 * @param {string} persianNum - عدد فارسی
 * @returns {number} - عدد انگلیسی
 */
export const toEnglishNumber = (persianNum: string): number => {
  let result = persianNum;
  PERSIAN_DIGITS.forEach((digit, index) => {
    result = result.replace(new RegExp(digit, 'g'), ENGLISH_DIGITS[index]);
  });
  return parseInt(result);
};

/**
 * تبدیل سال میلادی به شمسی
 */
export const gregorianToJalali = (
  gy: number,
  gm: number,
  gd: number
): [number, number, number] => {
  const g_d_n =
    365 * gy +
    Math.floor((gy + 3) / 4) -
    Math.floor((gy + 99) / 100) +
    Math.floor((gy + 399) / 400);

  let jy: number, jm: number, jd: number;

  const j_d_n = g_d_n - 79;
  jy = -1600 + 400 * Math.floor(j_d_n / 146097);
  j_d_n %= 146097;

  let leap = true;
  if (j_d_n >= 36525) {
    j_d_n--;
    jy += 100 * Math.floor(j_d_n / 36524);
    j_d_n %= 36524;

    if (j_d_n >= 365) j_d_n++;
    leap = false;
  }

  jy += 4 * Math.floor(j_d_n / 1461);
  j_d_n %= 1461;

  if (leap) {
    if (j_d_n >= 366) {
      j_d_n--;
      jy += Math.floor(j_d_n / 365);
      j_d_n = (j_d_n % 365) + 1;
    }
  } else {
    jy += Math.floor(j_d_n / 365);
    j_d_n = (j_d_n % 365) + 1;
  }

  const sal_a = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  if (jy % 4 === 0 && (jy % 100 !== 0 || jy % 400 === 0)) {
    sal_a[2] = 60;
    sal_a[3] = 91;
    sal_a[4] = 121;
    sal_a[5] = 152;
    sal_a[6] = 182;
    sal_a[7] = 213;
    sal_a[8] = 244;
    sal_a[9] = 274;
    sal_a[10] = 305;
    sal_a[11] = 335;
  }

  jm = 0;
  for (let i = 0; i < 12; i++) {
    if (j_d_n <= sal_a[i]) {
      jm = i;
      break;
    }
  }

  jd = j_d_n - sal_a[jm - 1];

  return [jy, jm, jd];
};

/**
 * تبدیل سال شمسی به میلادی
 */
export const jalaliToGregorian = (
  jy: number,
  jm: number,
  jd: number
): [number, number, number] => {
  const j_d_n = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor((jy % 33 + 3) / 4) + 78 + jd;

  let gy = 400 * Math.floor(j_d_n / 146097);
  j_d_n %= 146097;

  let leap = true;
  if (j_d_n >= 36525) {
    j_d_n--;
    gy += 100 * Math.floor(j_d_n / 36524);
    j_d_n %= 36524;
    if (j_d_n >= 365) j_d_n++;
    leap = false;
  }

  gy += 4 * Math.floor(j_d_n / 1461);
  j_d_n %= 1461;

  if (leap) {
    if (j_d_n >= 366) {
      j_d_n--;
      gy += Math.floor(j_d_n / 365);
      j_d_n = (j_d_n % 365) + 1;
    }
  } else {
    gy += Math.floor(j_d_n / 365);
    j_d_n = (j_d_n % 365) + 1;
  }

  const sal_a = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  if ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) {
    sal_a[2] = 60;
    sal_a[3] = 91;
    sal_a[4] = 121;
    sal_a[5] = 152;
    sal_a[6] = 182;
    sal_a[7] = 213;
    sal_a[8] = 244;
    sal_a[9] = 274;
    sal_a[10] = 305;
    sal_a[11] = 335;
  }

  let gm = 0;
  for (let i = 0; i < 12; i++) {
    if (j_d_n <= sal_a[i]) {
      gm = i;
      break;
    }
  }

  const gd = j_d_n - sal_a[gm - 1];

  return [gy, gm, gd];
};

/**
 * نام‌های ماه‌های شمسی
 */
export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/**
 * نام‌های روز‌های هفته
 */
export const WEEK_DAYS_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

/**
 * تعطیلات رسمی ایران
 */
export const IRAN_HOLIDAYS = [
  { name: 'عید نوروز', month: 1, day: 1 }, // فروردین ۱
  { name: 'روز دوم فروردین', month: 1, day: 2 },
  { name: 'روز سوم فروردین', month: 1, day: 3 },
  { name: 'روز چهارم فروردین', month: 1, day: 4 },
  { name: 'روز پنجم فروردین', month: 1, day: 5 },
  { name: 'روز سیزده به در', month: 1, day: 13 },
  { name: 'جمهوری اسلامی ایران', month: 11, day: 22 }, // بهمن ۲۲
  { name: 'پیروزی انقلاب', month: 12, day: 11 }, // اسفند ۱۱
];

/**
 * بررسی جمعه یا تعطیل رسمی
 */
export const isHoliday = (jy: number, jm: number, jd: number): boolean => {
  const date = new Date();
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  const gregorianDate = new Date(gy, gm - 1, gd);
  const dayOfWeek = gregorianDate.getDay();

  // جمعه (۵ - Friday)
  if (dayOfWeek === 5) return true;

  // تعطیلات رسمی
  return IRAN_HOLIDAYS.some((holiday) => holiday.month === jm && holiday.day === jd);
};

/**
 * فرمت کردن تاریخ شمسی
 * @param {Date} date - تاریخ
 * @param {string} format - فرمت (YYYY/MM/DD)
 * @returns {string} - تاریخ فرمت شده
 */
export const formatPersianDate = (date: Date, format: string = 'YYYY/MM/DD'): string => {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);

  let result = format;
  result = result.replace('YYYY', String(jy));
  result = result.replace('MM', String(jm).padStart(2, '0'));
  result = result.replace('DD', String(jd).padStart(2, '0'));

  // تبدیل به اعداد فارسی
  return toPersianNumber(result);
};

/**
 * فرمت کردن تاریخ شمسی با نام ماه
 */
export const formatPersianDateFull = (date: Date): string => {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
  const monthName = JALALI_MONTHS[jm - 1];

  return `${toPersianNumber(jd)} ${monthName} ${toPersianNumber(jy)}`;
};

/**
 * فرمت کردن تاریخ و روز هفته
 */
export const formatPersianDateWithDayName = (date: Date): string => {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
  const gregorianDate = new Date(gy, gm - 1, gd);
  const dayName = WEEK_DAYS_FA[gregorianDate.getDay()];
  const monthName = JALALI_MONTHS[jm - 1];

  return `${dayName} ${toPersianNumber(jd)} ${monthName} ${toPersianNumber(jy)}`;
};

/**
 * دریافت تاریخ امروز به صورت شمسی
 */
export const getPersianToday = (): [number, number, number] => {
  const today = new Date();
  const gy = today.getFullYear();
  const gm = today.getMonth() + 1;
  const gd = today.getDate();

  return gregorianToJalali(gy, gm, gd);
};

/**
 * تبدیل رشته‌های تاریخ شمسی
 */
export const parsePersianDate = (dateString: string): Date | null => {
  const parts = dateString.split('/').map(toEnglishNumber);

  if (parts.length !== 3) return null;

  const [jy, jm, jd] = parts;
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);

  return new Date(gy, gm - 1, gd);
};
