import { useState, useEffect, useMemo } from 'react'
import { Clock } from 'lucide-react'
import { toPersianDigits, JALALI_MONTH_NAMES, gregorianToJalali } from '../utils/jalali'

function IranClock() {
  const [irTime, setIrTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setIrTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { timeStr, dateStr } = useMemo(() => {
    const offset = 3.5 * 60
    const local = irTime.getTime() + irTime.getTimezoneOffset() * 60000
    const iran = new Date(local + offset * 60000)
    const h = String(iran.getHours()).padStart(2, '0')
    const m = String(iran.getMinutes()).padStart(2, '0')
    const s = String(iran.getSeconds()).padStart(2, '0')
    const [jy, jm, jd] = gregorianToJalali(iran.getFullYear(), iran.getMonth() + 1, iran.getDate())
    return {
      timeStr: `${toPersianDigits(h)}:${toPersianDigits(m)}:${toPersianDigits(s)}`,
      dateStr: `${toPersianDigits(jd)} ${JALALI_MONTH_NAMES[jm - 1]}`,
    }
  }, [irTime])

  return (
    <div className="hidden md:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all"
      style={{
        background: 'rgba(42,179,184,0.05)',
        borderColor: 'rgba(42,179,184,0.18)',
        color: 'var(--persian-lajvard)',
      }}>
      <Clock size={13} style={{ color: 'var(--persian-firuzeh)', flexShrink: 0 }} />
      <span className="num-persian">{timeStr}</span>
      <span style={{ color: 'rgba(26,74,138,0.5)', fontSize: '0.625rem' }}>|</span>
      <span style={{ color: 'var(--persian-firuzeh)', fontSize: '0.6875rem' }}>{dateStr}</span>
    </div>
  )
}

export default IranClock
