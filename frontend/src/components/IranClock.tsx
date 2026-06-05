import { useState, useEffect, useMemo } from 'react'
import { Clock } from 'lucide-react'

function IranClock() {
  const [irTime, setIrTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setIrTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeStr = useMemo(() => {
    const offset = 3.5 * 60
    const local = irTime.getTime() + irTime.getTimezoneOffset() * 60000
    const iran = new Date(local + offset * 60000)
    return iran.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [irTime])

  return (
    <div className="hidden md:flex items-center gap-1.5 text-xs text-surface-500 font-medium bg-surface-100 px-3 py-1.5 rounded-xl border border-surface-200">
      <Clock size={13} className="text-brand-500" />
      <span>{timeStr}</span>
    </div>
  )
}

export default IranClock
