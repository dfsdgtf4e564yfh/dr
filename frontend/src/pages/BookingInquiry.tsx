import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Calendar, Clock, User, Stethoscope, Globe, Hospital, CheckCircle, X, ArrowLeft, AlertCircle, Search } from 'lucide-react'
import { myAppointments } from '../services/api'
import { toEnglishDigits, toJalaliNumeric, nowJalali, toPersianDigits } from '../utils/jalali'

function getApptStatus(appt: any): { label: string; color: string; bg: string; icon: any } {
  const today = toEnglishDigits(nowJalali()).slice(0, 10)
  const date = toJalaliNumeric(appt.date || '')
  const cmp = date.localeCompare(today)
  const timeNow = new Date().toTimeString().slice(0, 5)
  const isPast = cmp < 0 || (cmp === 0 && appt.time && appt.time <= timeNow)
  const isFuture = cmp > 0 || (cmp === 0 && appt.time && appt.time > timeNow)
  if (appt.status === 'cancelled') return { label: 'لغو شده', color: 'text-red-500 bg-red-50 border-red-100', bg: 'bg-red-50/30 border-red-100', icon: X }
  if (appt.status === 'completed') return { label: 'انجام شده', color: 'text-green-600 bg-green-50 border-green-100', bg: 'bg-gray-50/50 border-gray-100', icon: CheckCircle }
  if (isPast) return { label: 'گذشته', color: 'text-gray-500 bg-gray-100 border-gray-200', bg: 'bg-gray-50 border-gray-100', icon: Clock }
  if (isFuture && cmp === 0) return { label: 'امروز', color: 'text-amber-600 bg-amber-50 border-amber-100', bg: 'bg-white border-gray-100', icon: Clock }
  return { label: 'پیش رو', color: 'text-blue-600 bg-blue-50 border-blue-100', bg: 'bg-white border-gray-100', icon: Clock }
}

export default function BookingInquiry() {
  const navigate = useNavigate()
  const { nationalId } = useParams()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!nationalId || nationalId.length !== 10) {
      toast.error('کد ملی نامعتبر است')
      navigate('/', { replace: true })
      return
    }
    const fileNumber = searchParams.get('file_number') || ''
    if (!fileNumber) {
      toast.error('شماره پرونده را وارد کنید')
      navigate('/', { replace: true })
      return
    }
    const cacheKey = 'inquiry_' + nationalId + '_' + fileNumber
    const stored = localStorage.getItem(cacheKey)
    if (stored) {
      try { setData(JSON.parse(stored)) } catch { localStorage.removeItem(cacheKey) }
      setLoading(false)
      return
    }
    myAppointments(nationalId, fileNumber)
      .then(({ data }) => { setData(data); localStorage.setItem(cacheKey, JSON.stringify(data)) })
      .catch(() => toast.error('خطا در استعلام'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      <div className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#2ab3b8] to-[#1a4a8a] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Search size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-1">استعلام نوبت</h2>
            <p className="text-sm text-gray-400">کد ملی: {toPersianDigits(nationalId)}</p>
            <p className="text-xs text-amber-600 font-semibold mt-2">⚠️ شماره پرونده خود را برای مراجعات بعدی نزد خود نگه دارید</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner-iranian" />
            </div>
          ) : !data ? (
            <div className="bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-300" />
              </div>
              <p className="text-gray-500">خطا در دریافت اطلاعات</p>
            </div>
          ) : (
            <div className="animate-fade-in-up space-y-4">
              {data.patient && (
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2ab3b8] to-[#1a4a8a] flex items-center justify-center text-white shadow-lg">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-700">{data.patient.first_name} {data.patient.last_name}</p>
                      {data.patient.file_number && <p className="text-xs text-gray-400">شماره پرونده: {toPersianDigits(data.patient.file_number)}</p>}
                    </div>
                  </div>
                </div>
              )}
              {(!data.appointments || data.appointments.length === 0) ? (
                <div className="bg-white rounded-3xl shadow-xl p-10 text-center border border-gray-100">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar size={32} className="text-gray-200" />
                  </div>
                  <p className="text-gray-400">هیچ نوبتی برای این کد ملی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.appointments.map((appt: any) => {
                    const st = getApptStatus(appt)
                    const Icon = st.icon
                    return (
                    <div key={appt.id} className={`bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-5 border transition-all ${st.bg}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${st.color.split(' ').slice(0, 2).join(' ')}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-700">{appt.jalali_date}</p>
                            <p className="text-xs text-gray-400">{appt.time} - {appt.service}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] px-3 py-1.5 rounded-full font-semibold ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5"><Stethoscope size={13} />{appt.service}</span>
                        <span className="flex items-center gap-1.5">{appt.source === 'online_booking' ? <><Globe size={13} />آنلاین</> : <><Hospital size={13} />حضوری</>}</span>
                      </div>
                    </div>
                    )})}
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-8">
            <button onClick={() => { if (nationalId) localStorage.removeItem('inquiry_' + nationalId); navigate('/', { replace: true }) }}
              className="inline-flex items-center gap-2 py-3 px-8 bg-gray-100 text-gray-600 rounded-2xl font-medium text-sm hover:bg-gray-200 transition-all">
              <ArrowLeft size={16} /> بازگشت
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
