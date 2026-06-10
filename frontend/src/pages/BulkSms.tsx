import React, { useState, useEffect } from 'react'
import { toPersianDigits } from '../utils/jalali'
import { toast } from 'react-toastify'
import { Send, Search, X, Users, Filter, MessageSquare, Phone, CheckCircle, AlertCircle } from 'lucide-react'
import { getPatients, getAppointments, getBillings, sendSmsReminder, sendSmsPayment, lookupPatients } from '../services/api'

const TEMPLATE_TYPE_OPTIONS = [
  { value: 'confirm', label: 'تأیید نوبت' },
  { value: 'reminder', label: 'یادآوری نوبت' },
  { value: 'payment', label: 'یادآوری پرداخت' },
]

export default function BulkSms() {
  const [step, setStep] = useState<number>(1)
  const [recipients, setRecipients] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState<boolean>(false)
  const [selectedPatients, setSelectedPatients] = useState<any[]>([])
  const [smsType, setSmsType] = useState<string>('reminder')
  const [customMessage, setCustomMessage] = useState<string>('')
  const [sending, setSending] = useState<boolean>(false)
  const [sendProgress, setSendProgress] = useState({ sent: 0, failed: 0, total: 0 })
  const [filterGender, setFilterGender] = useState<string>('')
  const [filterInsurance, setFilterInsurance] = useState<string>('')
  const [showFilters, setShowFilters] = useState<boolean>(false)

  useEffect(() => {
    if (searchQuery.length >= 2) {
      lookupPatients(searchQuery).then(({ data }: { data: any }) => {
        setSearchResults(Array.isArray(data) ? data : [])
        setShowResults(true)
      }).catch(() => {})
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery])

  const addRecipient = (patient: any) => {
    if (!patient.phone) { toast.error('متأسفانه این بیمار شماره تماس ندارد '); return }
    if (recipients.find(r => r.id === patient.id)) { toast.info('این بیمار قبلاً به لیست اضافه شده ℹ'); return }
    setRecipients([...recipients, { ...patient, phone: patient.phone }])
  }

  const removeRecipient = (id: number) => {
    setRecipients(recipients.filter(r => r.id !== id))
  }

  const loadAllPatients = async () => {
    try {
      const params: any = { is_deleted: false }
      if (filterGender) params.gender = filterGender
      if (filterInsurance) params.insurance_booklet = filterInsurance
      const res = await getPatients({ ...params, page_size: 1000 })
      const data = res.data as any
      const patients = data.results || data
      const withPhone = patients.filter((p: any) => p.phone)
      setRecipients(withPhone.map((p: any) => ({ id: p.id, first_name: p.first_name, last_name: p.last_name, phone: p.phone, national_id: p.national_id })))
      toast.success(`${withPhone.length} بیمار دارای شماره تماس یافت شدند `)
    } catch (err: any) { toast.error('متأسفانه در دریافت لیست بیماران خطایی رخ داد ') }
  }

  const handleSend = async () => {
    if (recipients.length === 0) { toast.error('هیچ دریافت‌کننده‌ای انتخاب نشده  لطفاً بیماران را اضافه کنید'); return }
    if (!window.confirm(`آیا از ارسال پیامک به ${recipients.length} نفر اطمینان دارید؟`)) return

    setSending(true)
    setSendProgress({ sent: 0, failed: 0, total: recipients.length })

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i]
      try {
        if (smsType === 'reminder') {
          const aptRes = await getAppointments({ patient: r.id, status: 'scheduled', date_from: new Date().toISOString().split('T')[0], page_size: 1 })
          const aptData = aptRes.data as any
          const appts = aptData.results || aptData
          if (appts.length > 0) {
            await sendSmsReminder(appts[0].id, customMessage || undefined)
          } else {
            setSendProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
            continue
          }
        } else {
          const billRes = await getBillings({ patient: r.id, status: 'pending', page_size: 1 })
          const billData = billRes.data as any
          const bills = billData.results || billData
          if (bills.length > 0) {
            await sendSmsPayment(r.id, bills[0].total_amount - bills[0].paid_amount, customMessage || undefined)
          } else {
            setSendProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
            continue
          }
        }
        setSendProgress(prev => ({ ...prev, sent: prev.sent + 1 }))
      } catch (err: any) {
        setSendProgress(prev => ({ ...prev, failed: prev.failed + 1 }))
      }
    }

    setSending(false)
    toast.success(`ارسال پیامک‌ها به پایان رسید  ${sendProgress.sent} موفق، ${sendProgress.failed} ناموفق `)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-slate-800">ارسال گروهی پیامک</h1>

      <div className="card bg-blue-50 border-blue-200 text-sm text-blue-700">
        <p>می‌توانید به صورت گروهی به بیماران پیامک یادآوری نوبت یا پرداخت ارسال کنید.</p>
      </div>

      {/* Step 1: Select Recipients */}
      <div className="panel card-iranian">
        <div className="panel-header panel-header-iranian">
          <h3 className="flex items-center gap-2"><Users size={18} className="text-brand-500" /> مرحله ۱: انتخاب دریافت‌کنندگان</h3>
        </div>
        <div className="panel-body space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 text-slate-400" size={16} />
              <input
                type="text"
                className="input-field pr-10"
                placeholder="جستجوی بیمار..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
              />
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                  {searchResults.map(p => (
                    <div key={p.id}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
                      onClick={() => { addRecipient(p); setSearchQuery(''); setShowResults(false) }}
                    >
                      <span className="font-medium">{p.first_name} {p.last_name}</span>
                      <span className="text-xs text-slate-400">{p.phone ? p.phone : 'بدون شماره'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary"><Filter size={16} /></button>
            <button onClick={loadAllPatients} className="btn-secondary">بارگذاری همه بیماران</button>
          </div>

          {showFilters && (
            <div className="flex gap-3">
              <select className="input-field w-40" value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                <option value="">همه جنسیت‌ها</option>
                <option value="male">مرد</option>
                <option value="female">زن</option>
              </select>
              <select className="input-field w-40" value={filterInsurance} onChange={e => setFilterInsurance(e.target.value)}>
                <option value="">همه بیمه‌ها</option>
                <option value="none">ندارد</option>
                <option value="social_security">تأمین اجتماعی</option>
                <option value="health_services">خدمات درمانی</option>
              </select>
            </div>
          )}

          {recipients.length > 0 && (
            <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
              {recipients.map(r => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span className="text-sm">{r.first_name} {r.last_name}</span>
                    <span className="text-xs text-slate-400">{r.phone}</span>
                  </div>
                  <button onClick={() => removeRecipient(r.id)} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">{recipients.length} دریافت‌کننده انتخاب شده</p>
        </div>
      </div>

      {/* Step 2: Configure Message */}
      <div className="panel card-iranian">
        <div className="panel-header panel-header-iranian">
          <h3 className="flex items-center gap-2"><MessageSquare size={18} className="text-brand-500" /> مرحله ۲: تنظیم پیام</h3>
        </div>
        <div className="panel-body space-y-3">
          <div>
            <label className="label">نوع پیامک</label>
            <select className="input-field" value={smsType} onChange={e => setSmsType(e.target.value)}>
              {TEMPLATE_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">متن پیام (اختیاری - در صورت خالی بودن از پیش‌فرض استفاده می‌شود)</label>
            <textarea className="input-field" rows={4} value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="متن دلخواه خود را وارد کنید..." />
          </div>
        </div>
      </div>

      {/* Step 3: Send */}
      <div className="panel card-iranian">
        <div className="panel-header panel-header-iranian">
          <h3 className="flex items-center gap-2"><Send size={18} className="text-brand-500" /> مرحله ۳: ارسال</h3>
        </div>
        <div className="panel-body">
          <button onClick={handleSend} disabled={sending || recipients.length === 0}
            className="btn-primary flex items-center gap-2 text-lg px-8 py-3">
            <Send size={20} /> {sending ? 'در حال ارسال...' : `ارسال به ${recipients.length} نفر`}
          </button>

          {sending && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">پیشرفت:</span>
                <div className="flex-1 bg-slate-200 rounded-full h-2.5">
                  <div className="bg-brand-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${recipients.length > 0 ? ((sendProgress.sent + sendProgress.failed) / sendProgress.total * 100) : 0}%` }} />
                </div>
                <span className="text-sm font-mono text-slate-500">{sendProgress.sent + sendProgress.failed}/{sendProgress.total}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> {sendProgress.sent} ارسال شده</span>
                <span className="flex items-center gap-1 text-red-600"><X size={14} /> {sendProgress.failed} ناموفق</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
