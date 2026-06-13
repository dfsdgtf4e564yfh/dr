import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, CalendarDays, X } from 'lucide-react'
import {
  toJalaliNumeric, fromJalali, toPersianDigits, toEnglishDigits, jalaliToGregorian,
  formatGregorian, JALALI_MONTH_NAMES, JALALI_DAY_NAMES
} from '../utils/jalali'
import { isHoliday, getHolidaysForDate } from '../utils/iranianHolidays'

interface JalaliDateInputProps {
  value?: string
  onChange?: (date: string) => void
  className?: string
  required?: boolean
  placeholder?: string
  label?: string
  error?: string
  labelClass?: string
}

function getJalaliYMD(gregValue: string): { year: number; month: number; day: number } | null {
  if (!gregValue) return null
  const parts = toJalaliNumeric(gregValue).split('/')
  if (parts.length !== 3) return null
  return { year: +parts[0], month: +parts[1], day: +parts[2] }
}

function getGregorianDate(jy: number, jm: number, jd: number): Date | null {
  const str = fromJalali(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`)
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function daysInMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  const isLeap = ((((jy + 12) % 33) % 4) === 1)
  return isLeap ? 30 : 29
}

function getFirstDayIndex(jy: number, jm: number): number {
  const d = getGregorianDate(jy, jm, 1)
  if (!d) return 0
  const jsDay = d.getDay()
  return (jsDay + 1) % 7
}

export default function JalaliDateInput({ value, onChange, className = '', required, placeholder = 'انتخاب تاریخ', label, error, labelClass }: JalaliDateInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayValue, setDisplayValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const [popupStyle, setPopupStyle] = useState<Record<string, string>>({})

  const today = useMemo(() => getJalaliYMD(formatGregorian(new Date())), [])
  const selected = useMemo(() => getJalaliYMD(value || ''), [value])

  const [viewYear, setViewYear] = useState(selected?.year || today?.year || 1403)
  const [viewMonth, setViewMonth] = useState(selected?.month || today?.month || 1)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  useEffect(() => {
    if (value) {
      const j = getJalaliYMD(value)
      setDisplayValue(j ? `${toPersianDigits(j.year)}/${toPersianDigits(String(j.month).padStart(2, '0'))}/${toPersianDigits(String(j.day).padStart(2, '0'))}` : '')
    } else setDisplayValue('')
  }, [value])

  useEffect(() => {
    if (selected) { setViewYear(selected.year); setViewMonth(selected.month) }
  }, [value])

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const top = rect.bottom + 4
      const left = rect.left
      setPopupStyle({ position: 'fixed', zIndex: '2147483647', top: `${top}px`, left: `${left}px` })
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) &&
          popupRef.current && !popupRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((day: number) => {
    const greg = fromJalali(`${viewYear}/${String(viewMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`)
    if (greg) onChange?.(greg)
    setIsOpen(false)
  }, [viewYear, viewMonth, onChange])

  const goPrevMonth = () => {
    if (viewMonth === 1) { if (viewYear > 1300) { setViewYear(viewYear - 1); setViewMonth(12) } }
    else setViewMonth(viewMonth - 1)
  }
  const goNextMonth = () => {
    if (viewMonth === 12) { if (viewYear < 1410) { setViewYear(viewYear + 1); setViewMonth(1) } }
    else setViewMonth(viewMonth + 1)
  }
  const goToday = () => { if (today) { setViewYear(today.year); setViewMonth(today.month) } }

  const firstDayIndex = getFirstDayIndex(viewYear, viewMonth)
  const totalDays = daysInMonth(viewYear, viewMonth)

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDayIndex; i++) days.push(null)
    for (let d = 1; d <= totalDays; d++) days.push(d)
    return days
  }, [firstDayIndex, totalDays])

  const isSelectedDay = (day: number) => selected && selected.year === viewYear && selected.month === viewMonth && selected.day === day
  const isTodayDay = (day: number) => today && today.year === viewYear && today.month === viewMonth && today.day === day
  const isHolidayDay = (day: number) => isHoliday(viewYear, viewMonth, day)
  const getDayEvents = (day: number) => getHolidaysForDate(viewYear, viewMonth, day)

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className={`label ${labelClass || ''}`}>
          {label}
          {required && <span className="text-rose-500 mr-0.5">*</span>}
        </label>
      )}
      <div className={`input-field flex items-center p-0 overflow-hidden ${className}`}>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="p-2.5 shrink-0 border-l border-surface-200 hover:bg-brand-50 transition-colors" title="انتخاب از تقویم">
          <CalendarDays size={20} className="text-brand-500" />
        </button>
        <input
          type="text"
          value={displayValue || ''}
          onChange={e => {
            const raw = toEnglishDigits(e.target.value).replace(/[^\d]/g, '')
            let formatted = ''
            if (raw.length > 0) formatted = raw.slice(0, 4)
            if (raw.length > 4) formatted += '/' + raw.slice(4, 6)
            if (raw.length > 6) formatted += '/' + raw.slice(6, 8)
            setDisplayValue(formatted)
            if (raw.length === 8) {
              const jy = +raw.slice(0, 4), jm = +raw.slice(4, 6), jd = +raw.slice(6, 8)
              if (jy >= 1300 && jy <= 1410 && jm >= 1 && jm <= 12 && jd >= 1 && jd <= 31) {
                const g = jalaliToGregorian(jy, jm, jd)
                if (g) onChange?.(`${g[0]}-${String(g[1]).padStart(2, '0')}-${String(g[2]).padStart(2, '0')}`)
              }
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm px-3 py-[0.7rem] min-h-[44px]"
        />
      </div>

      {error && <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{error}</p>}

      {isOpen && createPortal(
        <div ref={popupRef} style={popupStyle}>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white rounded-2xl border border-surface-200 shadow-soft-lg overflow-hidden"
              style={{ width: '288px' }}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-surface-100">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={goPrevMonth}
                  className="p-1.5 hover:bg-surface-100 rounded-xl transition-colors text-surface-500"
                >
                  <ChevronRight size={18} />
                </motion.button>
                <div className="flex gap-2 items-center">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false) }}
                    className="text-sm font-bold text-surface-800 hover:text-brand-500 transition-colors px-2 py-0.5 rounded-lg hover:bg-brand-50"
                  >
                    {JALALI_MONTH_NAMES[viewMonth - 1]}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false) }}
                    className="text-sm font-bold text-surface-800 hover:text-brand-500 transition-colors px-2 py-0.5 rounded-lg hover:bg-brand-50"
                  >
                    {toPersianDigits(viewYear)}
                  </motion.button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={goNextMonth}
                  className="p-1.5 hover:bg-surface-100 rounded-xl transition-colors text-surface-500"
                >
                  <ChevronLeft size={18} />
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {showYearPicker && (
                  <motion.div
                    key="year"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-52 overflow-y-auto px-4 py-3">
                      <div className="grid grid-cols-4 gap-1.5">
                        {Array.from({ length: 111 }, (_, i) => 1300 + i).reverse().map(y => (
                          <motion.button
                            key={y}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setViewYear(y); setShowYearPicker(false) }}
                            className={`
                              py-2 text-sm font-bold rounded-xl transition-all
                              ${y === viewYear
                                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                                : y === (selected?.year || today?.year || 1403)
                                  ? 'text-rose-500 font-black'
                                  : 'hover:bg-surface-100 text-surface-700'
                              }
                            `}
                          >
                            {toPersianDigits(y)}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {showMonthPicker && (
                  <motion.div
                    key="month"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-3 gap-2 px-4 py-3">
                      {JALALI_MONTH_NAMES.map((name, i) => (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { setViewMonth(i + 1); setShowMonthPicker(false) }}
                          className={`
                            py-2.5 text-sm font-bold rounded-xl transition-all
                            ${i + 1 === viewMonth
                              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                              : i + 1 === (selected?.month || today?.month || 1)
                                ? 'text-rose-500 font-black'
                                : 'hover:bg-surface-100 text-surface-700'
                            }
                          `}
                        >
                          {name}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {!showYearPicker && !showMonthPicker && (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="grid grid-cols-7 px-4 pt-3 pb-1">
                      {JALALI_DAY_NAMES.map((name, i) => (
                        <div key={i} className="text-center text-[11px] font-bold text-surface-400 py-1.5">
                          {name}
                        </div>
                      ))}
                    </div>

                    <div className="px-4 pb-2">
                      <div className="grid grid-cols-7">
                        {calendarDays.map((day, idx) => (
                          <div key={idx} className="aspect-square p-0.5">
                            {day ? (
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => handleSelect(day)}
                                className={`
                                  w-full h-full flex items-center justify-center text-sm font-bold rounded-xl transition-all relative
                                  ${isSelectedDay(day)
                                    ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-500/20'
                                    : isTodayDay(day)
                                      ? isHolidayDay(day)
                                        ? 'text-red-500 font-black border-2 border-red-300'
                                        : 'text-rose-500 font-black border-2 border-rose-200'
                                      : isHolidayDay(day)
                                        ? 'text-red-400 hover:bg-red-50'
                                        : 'hover:bg-brand-50 text-surface-700'
                                  }
                                `}
                                title={getDayEvents(day).map(e => e.title).join(' | ')}
                              >
                                {toPersianDigits(day)}
                                {isHolidayDay(day) && !isSelectedDay(day) && (
                                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
                                )}
                              </motion.button>
                            ) : (
                              <div />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100 bg-surface-50/50">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={goToday}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-brand-50"
                >
                  امروز
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { onChange?.(''); setIsOpen(false) }}
                  className="text-xs font-semibold text-surface-400 hover:text-surface-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-surface-100 flex items-center gap-1"
                >
                  <X size={12} />
                  پاک کردن
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </div>
  )
}
