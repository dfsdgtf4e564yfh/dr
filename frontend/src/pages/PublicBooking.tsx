import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Calendar, Clock, User, MapPin, Instagram, CheckCircle, Stethoscope, ArrowRight, ArrowLeft, Printer, ExternalLink } from 'lucide-react'
import { getClinicInfo, getBookingServices, patientLookup, getAvailableTimes, createBooking } from '../services/api'
import { gregorianToJalali, jalaliToGregorian } from '../utils/jalali'

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

export default function PublicBooking() {
  const [clinic, setClinic] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [step, setStep] = useState<'info' | 'form' | 'receipt'>('info')
  const [nationalId, setNationalId] = useState('')
  const [patientData, setPatientData] = useState<any>(null)
  const [patientExists, setPatientExists] = useState<boolean | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', gender: 'male', birth_date: '' })
  const [serviceId, setServiceId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState('in_person')
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [timesLoading, setTimesLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    const [jyy, jmm] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
    return { year: jyy, month: jmm }
  })
  const nationalRef = useRef<HTMLInputElement>(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const payment = searchParams.get('payment')
    const tracking = searchParams.get('tracking')
    if (payment === 'success') {
      toast.success(`پرداخت با موفقیت انجام شد. کد پیگیری: ${tracking || ''}`)
    } else if (payment === 'failed') {
      toast.error('پرداخت ناموفق بود. می‌توانید در مراجعه حضوری پرداخت کنید')
    } else if (payment === 'cancelled') {
      toast.warning('پرداخت لغو شد')
    }
  }, [searchParams])

  useEffect(() => {
    getClinicInfo().then(({ data }) => setClinic(data)).catch(() => {})
    getBookingServices().then(({ data }) => setServices(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const handleLookup = async () => {
    const nid = nationalId.replace(/\D/g, '')
    if (nid.length !== 10) { toast.error('کد ملی باید ۱۰ رقم باشد'); return }
    setLookupLoading(true)
    try {
      const { data } = await patientLookup(nid)
      if (data.exists) {
        setPatientExists(true)
        setPatientData(data)
        setForm({ first_name: data.first_name || '', last_name: data.last_name || '', phone: data.phone || '', gender: data.gender || 'male', birth_date: data.birth_date || '' })
      } else {
        setPatientExists(false)
        setPatientData(null)
        setForm({ first_name: '', last_name: '', phone: '', gender: 'male', birth_date: '' })
      }
    } catch { toast.error('خطا در جستجوی بیمار') }
    finally { setLookupLoading(false) }
  }

  const handleDateSelect = (day: number) => {
    const month = calendarMonth.month
    const year = calendarMonth.year
    const [gy, gm, gd] = jalaliToGregorian(year, month, day)
    const ds = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`
    setSelectedDate(ds)
    setSelectedTime('')
  }

  useEffect(() => {
    if (serviceId && selectedDate) {
      setTimesLoading(true)
      getAvailableTimes(Number(serviceId), selectedDate)
        .then(({ data }) => setAvailableTimes(data.times || []))
        .catch(() => setAvailableTimes([]))
        .finally(() => setTimesLoading(false))
    }
  }, [serviceId, selectedDate])

  const handleSubmit = async () => {
    if (!nationalId || !serviceId || !selectedDate || !selectedTime) { toast.error('همه موارد را تکمیل کنید'); return }
    if (!patientExists && (!form.first_name || !form.last_name || !form.phone)) { toast.error('لطفاً اطلاعات خود را وارد کنید'); return }
    setLoading(true)
    try {
      const payload: any = {
        national_id: nationalId.replace(/\D/g, ''),
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        gender: form.gender || 'male',
        birth_date: form.birth_date || null,
        service_id: Number(serviceId),
        date: selectedDate,
        time: selectedTime + ':00',
        payment_method: paymentMethod,
      }
      const { data } = await createBooking(payload)
      setResult(data)
      setPaymentUrl(data.payment_url || '')
      setStep('receipt')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'خطا در ثبت نوبت')
    }
    finally { setLoading(false) }
  }

  const prevMonth = () => setCalendarMonth(m => {
    if (m.month === 1) return { year: m.year - 1, month: 12 }
    return { ...m, month: m.month - 1 }
  })
  const nextMonth = () => setCalendarMonth(m => {
    if (m.month === 12) return { year: m.year + 1, month: 1 }
    return { ...m, month: m.month + 1 }
  })

  const calendarDays = getCalendarDays(calendarMonth.year, calendarMonth.month, selectedDate)

  if (clinic) {
    if (step === 'receipt' && result) return renderReceipt(result, clinic, paymentUrl, () => { setStep('info'); setResult(null); setPaymentUrl(''); setNationalId(''); setPatientData(null); setPatientExists(null); setServiceId(''); setSelectedDate(''); setSelectedTime(''); setAvailableTimes([]) })
    if (step === 'form' || step === 'info') {
      return renderBookingForm(clinic, services, step, setStep, nationalId, setNationalId, nationalRef, patientExists, patientData, lookupLoading, handleLookup, form, setForm, serviceId, setServiceId, calendarMonth, calendarDays, prevMonth, nextMonth, selectedDate, handleDateSelect, selectedTime, setSelectedTime, availableTimes, timesLoading, paymentMethod, setPaymentMethod, loading, handleSubmit)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )
}

function renderReceipt(result: any, clinic: any, paymentUrl: string, reset: () => void) {
  const p = result.patient || {}
  const a = result.appointment || {}
  const [gy, gm, gd] = (a.date || '').split('-').map(Number)
  const j = gy ? gregorianToJalali(gy, gm, gd) : null
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={36} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">نوبت با موفقیت ثبت شد</h2>
          <p className="text-sm text-gray-500">مطب {clinic?.doctor_name}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 space-y-3 mb-5 border border-gray-100">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-sm text-gray-500">کد رهگیری</span>
            <span className="text-lg font-bold text-blue-700 font-mono ltr" dir="ltr">{result.tracking_code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">بیمار</span>
            <span className="text-sm font-medium">{p.first_name} {p.last_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">شماره پرونده</span>
            <span className="text-sm font-medium">{p.file_number || '—'}</span>
          </div>
          {j && <div className="flex justify-between">
            <span className="text-sm text-gray-500">تاریخ</span>
            <span className="text-sm font-medium">{j[2]} {MONTHS[j[1] - 1]} {j[0]}</span>
          </div>}
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">ساعت</span>
            <span className="text-sm font-medium">{a.time?.substring(0, 5)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">خدمت</span>
            <span className="text-sm font-medium">{a.service}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">وضعیت پرداخت</span>
            <span className={`text-sm font-medium ${a.payment_method === 'online' ? 'text-green-600' : 'text-amber-600'}`}>
              {a.payment_method === 'online' ? 'پرداخت شده' : 'پرداخت در مطب'}
            </span>
          </div>
          {a.price > 0 && <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-500">مبلغ</span>
            <span className="text-sm font-bold">{a.price.toLocaleString()} تومان</span>
          </div>}
        </div>

        <div className="flex gap-3">
          {paymentUrl && (
            <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition flex items-center justify-center gap-2">
              <ExternalLink size={18} /> پرداخت آنلاین
            </a>
          )}
          <button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <Printer size={18} /> پرینت رسید
          </button>
          <button onClick={reset} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2">
            نوبت جدید
          </button>
        </div>
      </div>
    </div>
  )
}

function renderBookingForm(
  clinic: any, services: any[], step: string, setStep: any,
  nationalId: string, setNationalId: any, nationalRef: any,
  patientExists: boolean | null, patientData: any, lookupLoading: boolean, handleLookup: any,
  form: any, setForm: any, serviceId: string, setServiceId: any,
  calendarMonth: any, calendarDays: any[], prevMonth: any, nextMonth: any,
  selectedDate: string, handleDateSelect: any,
  selectedTime: string, setSelectedTime: any,
  availableTimes: string[], timesLoading: boolean,
  paymentMethod: string, setPaymentMethod: any,
  loading: boolean, handleSubmit: any,
) {
  const [gy, gm, gd] = selectedDate ? selectedDate.split('-').map(Number) : [0, 0, 0]
  const j = gy ? gregorianToJalali(gy, gm, gd) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-l from-blue-700 to-blue-900 text-white py-6 px-4 sm:py-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h1 className="text-xl sm:text-3xl font-bold mb-1">{clinic?.doctor_name}</h1>
          <p className="text-blue-100 text-sm sm:text-base mb-2">{clinic?.specialty}</p>
          <p className="text-yellow-200 text-xs sm:text-sm font-semibold bg-blue-800/50 inline-block px-3 py-1 rounded-full">{clinic?.tagline}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-blue-100 text-xs">
            <span className="flex items-center gap-1"><MapPin size={12} />{clinic?.phone}</span>
            {clinic?.instagram && <a href={clinic.instagram} target="_blank" className="flex items-center gap-1 text-pink-200 hover:text-pink-100"><Instagram size={12} />اینستاگرام</a>}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 -mt-4">
        {/* Clinic Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-blue-50">
          <p className="text-sm text-gray-600 leading-relaxed flex items-start gap-2">
            <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
            {clinic?.address}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {clinic?.google_maps && <a href={clinic.google_maps} target="_blank" className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Google Maps</a>}
            {clinic?.waze && <a href={clinic.waze} target="_blank" className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">Waze</a>}
            {clinic?.balad && <a href={clinic.balad} target="_blank" className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition">Balad</a>}
            {clinic?.neshan && <a href={clinic.neshan} target="_blank" className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition">Neshan</a>}
          </div>
        </div>

        {/* Step 1: National ID */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border border-blue-50">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            استعلام بیمار
          </h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <input ref={nationalRef} className="input-field text-center text-lg font-bold tracking-widest" placeholder="کد ملی ۱۰ رقمی" value={nationalId} onChange={e => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} inputMode="numeric" />
            </div>
            <button onClick={handleLookup} disabled={lookupLoading || nationalId.length !== 10} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
              {lookupLoading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <User size={18} />}
              استعلام
            </button>
          </div>
        </div>

        {/* Step 2: Patient Info (appears after lookup) */}
        {patientExists !== null && (
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-blue-50">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              {patientExists ? 'تأیید اطلاعات' : 'ثبت اطلاعات'}
            </h2>

            {patientExists && patientData && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between"><span className="text-sm text-gray-500">نام</span><span className="text-sm font-medium">{patientData.first_name} {patientData.last_name}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">کد ملی</span><span className="text-sm font-medium">{patientData.national_id}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">شماره همراه</span><span className="text-sm font-medium">{patientData.phone}</span></div>
                {patientData.file_number && <div className="flex justify-between"><span className="text-sm text-gray-500">شماره پرونده</span><span className="text-sm font-medium">{patientData.file_number}</span></div>}
              </div>
            )}

            {!patientExists && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label text-xs">نام</label><input className="input-field" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></div>
                <div><label className="label text-xs">نام خانوادگی</label><input className="input-field" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></div>
                <div><label className="label text-xs">شماره همراه</label><input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} inputMode="tel" /></div>
                <div>
                  <label className="label text-xs">جنسیت</label>
                  <select className="input-field" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="male">آقا</option>
                    <option value="female">خانم</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Service Selection */}
        {patientExists !== null && (
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-blue-50">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              انتخاب خدمت
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {services.map((s: any) => (
                <button key={s.id} onClick={() => setServiceId(String(s.id))}
                  className={`p-3 rounded-xl border-2 text-center transition text-sm ${serviceId === String(s.id) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 hover:border-blue-200 text-gray-600'}`}>
                  <Stethoscope size={20} className="mx-auto mb-1 opacity-60" />
                  {s.name}
                  {s.price > 0 && <div className="text-xs text-gray-400 mt-1">{s.price.toLocaleString()} تومان</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Date Selection */}
        {serviceId && (
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-blue-50">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              تاریخ نوبت
            </h2>
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><ArrowRight size={18} /></button>
              <span className="font-bold text-sm">{MONTHS[calendarMonth.month - 1]} {calendarMonth.year}</span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><ArrowLeft size={18} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {WEEKDAYS.map(d => <div key={d} className="text-xs text-gray-400 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d: any, i: number) => (
                d ? (
                  <button key={i} onClick={() => !d.disabled && handleDateSelect(d.day)}
                    disabled={d.disabled}
                    className={`p-2 text-sm rounded-lg transition ${d.disabled ? 'text-gray-200 cursor-not-allowed' : d.selected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50 text-gray-700'}`}>
                    {d.day}
                  </button>
                ) : <div key={i} />
              ))}
            </div>
            {j && <p className="text-center text-sm text-gray-500 mt-2">{j[2]} {MONTHS[j[1] - 1]} {j[0]}</p>}
          </div>
        )}

        {/* Step 5: Time Selection */}
        {selectedDate && (
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-blue-50">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
              ساعت نوبت
            </h2>
            {timesLoading ? (
              <div className="flex justify-center py-4"><span className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
            ) : availableTimes.length === 0 ? (
              <p className="text-center text-gray-400 py-4">هیچ ساعت آزادی برای این روز وجود ندارد</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {availableTimes.map((t: string) => (
                  <button key={t} onClick={() => setSelectedTime(t)}
                    className={`p-2.5 rounded-xl border-2 text-sm transition ${selectedTime === t ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-100 hover:border-blue-200 text-gray-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 6: Payment Method */}
        {selectedTime && (
          <div className="bg-white rounded-2xl shadow-lg p-5 border border-blue-50">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">6</span>
              روش پرداخت
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPaymentMethod('in_person')}
                className={`p-4 rounded-xl border-2 text-center transition ${paymentMethod === 'in_person' ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-amber-200'}`}>
                <span className="text-2xl">💵</span>
                <p className="text-sm font-medium mt-1">پرداخت در مطب</p>
                <p className="text-xs text-gray-400">هنگام مراجعه</p>
              </button>
              <button onClick={() => setPaymentMethod('online')}
                className={`p-4 rounded-xl border-2 text-center transition ${paymentMethod === 'online' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200'}`}>
                <span className="text-2xl">💳</span>
                <p className="text-sm font-medium mt-1">پرداخت آنلاین</p>
                <p className="text-xs text-gray-400">زرین‌پال</p>
              </button>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="mt-5 w-full py-3.5 bg-gradient-to-l from-blue-700 to-blue-600 text-white rounded-xl font-bold hover:from-blue-800 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-base">
              {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <Calendar size={20} />}
              {loading ? 'در حال ثبت نوبت...' : 'ثبت نوبت'}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400">
        <p>مطب دکتر محمد طاهری طاهرآباد - {clinic?.phone}</p>
      </footer>
    </div>
  )
}

function getCalendarDays(jy: number, jm: number, selectedDate: string) {
  const today = new Date()
  const dm = jm <= 6 ? 31 : 30
  const firstDay = new Date(jalaliToGregorian(jy, jm, 1)[0], jalaliToGregorian(jy, jm, 1)[1] - 1, 1).getDay()
  const adjust = firstDay === 6 ? 0 : firstDay + 1
  const days: any[] = []
  for (let i = 0; i < adjust; i++) days.push(null)
  for (let d = 1; d <= dm; d++) {
    const [gy, gm, gd] = jalaliToGregorian(jy, jm, d)
    const date = new Date(gy, gm - 1, gd)
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const isFriday = date.getDay() === 5
    const isSelected = selectedDate && gy === Number(selectedDate.split('-')[0]) && gm === Number(selectedDate.split('-')[1]) && gd === Number(selectedDate.split('-')[2])
    days.push({ day: d, disabled: isPast || isFriday, selected: isSelected, date: date })
  }
  return days
}
