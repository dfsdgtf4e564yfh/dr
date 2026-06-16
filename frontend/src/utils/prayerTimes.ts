interface PrayerTimes {
  imsak: string
  fajr: string
  sunrise: string
  dhuhr: string
  sunset: string
  maghrib: string
  isha: string
}

export function calculatePrayerTimes(date: Date, lat: number, lon: number): PrayerTimes {
  const day = Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000) + 1
  const gmtOffset = 3.5
  const d = Math.PI / 180

  const eqtime = (n: number): number => {
    const g = 357.529 + 0.98560028 * (n - 1)
    const q = 280.459 + 0.98564736 * (n - 1)
    const l = q + 1.915 * Math.sin(g * d) + 0.020 * Math.sin(2 * g * d)
    const e = 23.439 - 0.00000036 * (n - 1)
    const ra = Math.atan2(Math.cos(e * d) * Math.sin(l * d), Math.cos(l * d)) / d
    return (q + (q - ra < -180 ? 360 : q - ra > 180 ? -360 : 0)) / 15
  }

  const declination = (n: number): number => {
    const e = 23.439 - 0.00000036 * (n - 1)
    const l = 280.459 + 0.98564736 * (n - 1) + 1.915 * Math.sin(357.529 * d + 0.98560028 * (n - 1) * d) + 0.020 * Math.sin(2 * (357.529 * d + 0.98560028 * (n - 1) * d))
    return Math.asin(Math.sin(e * d) * Math.sin(l * d)) / d
  }

  const hourAngle = (angle: number): number => {
    const dec = declination(day) * d
    const phi = lat * d
    return Math.acos((Math.sin(angle * d) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec))) / d
  }

  const sunriseHourAngle = hourAngle(-0.833)
  const sunrise = 12 - sunriseHourAngle - eqtime(day) / 60 - gmtOffset
  const sunset = 12 + sunriseHourAngle - eqtime(day) / 60 - gmtOffset
  const sunriseMin = (sunrise - 0.5) * 60 + lon
  const sunsetMin = (sunset + 0.5) * 60 + lon

  const fajrAngle = hourAngle(-18)
  const fajr = 12 - fajrAngle - eqtime(day) / 60 - gmtOffset
  const maghrib = 12 + hourAngle(-4.5) - eqtime(day) / 60 - gmtOffset
  const isha = 12 + hourAngle(-17) - eqtime(day) / 60 - gmtOffset
  const dhuhr = (sunrise + sunset) / 2

  const toTime = (mins: number): string => {
    const total = mins + lon
    const h = Math.floor(total / 60)
    const m = Math.floor(total % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  return {
    imsak: toTime(fajr * 60 + lon - 10),
    fajr: toTime(fajr * 60 + lon),
    sunrise: toTime(sunriseMin),
    dhuhr: toTime(dhuhr * 60 + lon + 2),
    sunset: toTime(sunsetMin),
    maghrib: toTime(maghrib * 60 + lon),
    isha: toTime(isha * 60 + lon),
  }
}
