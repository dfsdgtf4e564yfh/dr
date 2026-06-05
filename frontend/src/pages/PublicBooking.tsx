import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Calendar, Clock, User, Phone, CreditCard } from 'lucide-react'
import { getDoctors, getTreatmentTypes, publicBookAppointment } from '../services/api'
import JalaliDateInput from '../components/JalaliDateInput'

export default function PublicBooking() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [done, setDone] = useState<boolean>(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', national_id: '', phone: '',
    doctor: '', treatment_type: '', date: '', time: '',
  })

  useEffect(() => {
    getDoctors().then(({ data }: { data: any }) => setDoctors(Array.isArray(data) ? data : data.results || [])).catch(() => {})
    getTreatmentTypes().then(({ data }: { data: any }) => setTreatments(Array.isArray(data) ? data : data.results || [])).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await publicBookAppointment(form)
      toast.success('نوبت شما با موفقیت ثبت شد  به زودی با شما تماس خواهیم گرفت')
      setDone(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'متأسفانه در ثبت نوبت خطایی رخ داد  لطفاً مجدد تلاش کنید')
    }
    finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">نوبت شما ثبت شد</h2>
          <p className="text-sm sm:text-base text-slate-500 mb-6">به زودی با شما تماس خواهیم گرفت</p>
          <button onClick={() => { setDone(false); setForm({ first_name: '', last_name: '', national_id: '', phone: '', doctor: '', treatment_type: '', date: '', time: '' }) }} className="btn-primary w-full touch-target">
            ثبت نوبت جدید
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex items-center justify-center p-3 sm:p-4 safe-area-bottom">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar size={28} className="text-brand-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">نوبت دهی آنلاین</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">مطب تخصصی دکتر محمد طاهری</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs sm:text-sm"><User size={14} className="inline ml-1" />نام</label>
              <input className="input-field touch-target" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
            </div>
            <div>
              <label className="label text-xs sm:text-sm"><User size={14} className="inline ml-1" />نام خانوادگی</label>
              <input className="input-field touch-target" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
            </div>
          </div>

          <div>
            <label className="label text-xs sm:text-sm"><CreditCard size={14} className="inline ml-1" />کد ملی</label>
            <input className="input-field touch-target" value={form.national_id} onChange={e => setForm({ ...form, national_id: e.target.value })} required placeholder="۱۰ رقم" inputMode="numeric" />
          </div>

          <div>
            <label className="label text-xs sm:text-sm"><Phone size={14} className="inline ml-1" />تلفن همراه</label>
            <input className="input-field touch-target" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required placeholder="09123456789" inputMode="tel" />
          </div>

          <div>
            <label className="label text-xs sm:text-sm">پزشک</label>
            <select className="input-field touch-target" value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} required>
              <option value="">انتخاب پزشک</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </div>

          <div>
            <label className="label text-xs sm:text-sm">نوع درمان</label>
            <select className="input-field touch-target" value={form.treatment_type} onChange={e => setForm({ ...form, treatment_type: e.target.value })} required>
              <option value="">انتخاب نوع درمان</option>
              {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs sm:text-sm"><Calendar size={14} className="inline ml-1" />تاریخ</label>
              <JalaliDateInput value={form.date} onChange={v => setForm({ ...form, date: v })} required />
            </div>
            <div>
              <label className="label text-xs sm:text-sm"><Clock size={14} className="inline ml-1" />ساعت</label>
              <input type="time" className="input-field touch-target" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full touch-target flex items-center justify-center gap-2 text-sm sm:text-base">
            {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Calendar size={18} />}
            {loading ? 'در حال ثبت...' : 'ثبت نوبت'}
          </button>
        </form>
      </div>
    </div>
  )
}
