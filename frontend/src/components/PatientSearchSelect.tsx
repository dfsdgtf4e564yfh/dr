import { useState, useRef, useEffect } from 'react'
import { Search, User } from 'lucide-react'
import { searchPatients } from '../services/api'
import { toEnglishDigits } from '../utils/jalali'
import type { Patient } from '../types'

interface PatientSearchSelectProps {
  value?: string
  onSelect: (patient: Patient) => void
  minChars?: number
  placeholder?: string
  className?: string
}

export default function PatientSearchSelect({ value, onSelect, minChars = 2, placeholder = 'جستجوی بیمار...', className = '' }: PatientSearchSelectProps) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState<Patient[]>([])
  const [open, setOpen] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < minChars) {
        setResults([])
        return
      }
      try {
        const { data } = await searchPatients(toEnglishDigits(query))
        setResults(Array.isArray(data) ? data : (data as any).results || [])
        setOpen(true)
        setSelectedIdx(-1)
      } catch (err) { console.error('PatientSearchSelect error:', err) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, minChars])

  const handleSelect = (p: Patient) => {
    setQuery(`${p.first_name} ${p.last_name}`)
    setOpen(false)
    onSelect(p)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault()
      handleSelect(results[selectedIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="input-field pr-11"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 right-0 left-0 bg-white border border-surface-200 rounded-2xl shadow-soft-lg z-50 max-h-60 overflow-y-auto">
          {results.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => handleSelect(p)}
              className={`w-full text-right flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                i === selectedIdx ? 'bg-brand-50 text-brand-600' : 'text-surface-700 hover:bg-surface-50'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
                <User size={14} className="text-surface-400" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate text-surface-800">{p.first_name} {p.last_name}</p>
                {p.phone && <p className="text-[11px] text-surface-400 ltr" dir="ltr">{p.phone}</p>}
              </div>
              {p.national_id && (
                <span className="mr-auto text-[11px] text-surface-400 ltr" dir="ltr">{p.national_id}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
