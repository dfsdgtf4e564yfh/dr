import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { CheckCircle, Printer, ExternalLink, ArrowLeft, MapPin, Phone, Clock } from 'lucide-react'
import { gregorianToJalali, toPersianDigits, smartPersianDigits } from '../utils/jalali'

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']

export default function BookingReceipt() {
  const navigate = useNavigate()
  const { trackingCode } = useParams()
  const stored = trackingCode ? localStorage.getItem('booking_' + trackingCode) : null
  let data: any = null
  try { data = stored ? JSON.parse(stored) : null } catch { data = null }
  const result = data?.result
  const paymentUrl = data?.paymentUrl || ''

  useEffect(() => {
    if (!result) {
      toast.error('اطلاعات نوبت یافت نشد')
      navigate('/', { replace: true })
    }
  }, [])

  if (!result) return null

  const p = result.patient || {}
  const a = result.appointment || {}
  const [gy, gm, gd] = (a.date || '').split('-').map(Number)
  const j = gy ? gregorianToJalali(gy, gm, gd) : null
  const jalaliStr = j ? `${j[2]} ${MONTHS[j[1] - 1]} ${j[0]}` : ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
      <div className="py-16 px-4">
        <div className="max-w-md mx-auto">
          {j && (
            <div className="text-center mb-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-3 bg-gradient-to-br from-[#1a4a8a] to-[#2ab3b8] text-white rounded-[2rem] px-8 py-4 shadow-2xl shadow-[#1a4a8a]/30">
                <div className="text-center">
                  <div className="text-[10px] font-medium opacity-70">{WEEKDAYS[new Date(gy, gm - 1, gd).getDay()]}</div>
                   <div className="text-4xl font-black leading-tight">{toPersianDigits(j[2])}</div>
                   <div className="text-xs font-medium opacity-80">{MONTHS[j[1] - 1]} {toPersianDigits(j[0])}</div>
                </div>
                <div className="w-px h-16 bg-white/20" />
                <div className="text-center">
                  <div className="text-[10px] font-medium opacity-70">ساعت</div>
                   <div className="text-3xl font-black">{toPersianDigits(a.time?.substring(0, 5))}</div>
                  <div className="text-xs font-medium opacity-80">{a.service}</div>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                <CheckCircle size={36} className="text-white" />
              </div>
              <h2 className="text-xl font-black text-gray-800 mb-1">نوبت با موفقیت ثبت شد</h2>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-5 space-y-3 mb-5 border border-gray-100">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-xs text-gray-400">کد رهگیری</span>
                <span className="text-lg font-bold text-[#1a4a8a] font-mono ltr" dir="ltr">{smartPersianDigits(result.tracking_code)}</span>
              </div>
              <InfoRow label="بیمار" value={`${p.first_name} ${p.last_name}`} />
              <InfoRow label="کد ملی" value={toPersianDigits(p.national_id)} />
              <InfoRow label="شماره پرونده" value={p.file_number ? smartPersianDigits(p.file_number) : '—'} />
              <InfoRow label="خدمت" value={a.service} />
              <InfoRow label="وضعیت پرداخت" value={a.payment_method === 'online' ? 'پرداخت شده' : 'پرداخت در مطب'}
                valueClass={a.payment_method === 'online' ? 'text-green-600' : 'text-amber-600'} />
              {a.price > 0 && <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">مبلغ</span>
                <span className="text-sm font-bold text-gray-800">{toPersianDigits(a.price.toLocaleString())} تومان</span>
              </div>}
            </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                <div className="flex items-start gap-2 mb-3">
                  <Clock size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-semibold">لطفاً ۱۵ دقیقه قبل از نوبت در مطب حضور داشته باشید.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 shrink-0 mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-800 font-semibold">شماره پرونده خود را جهت استعلام و مراجعات بعدی نزد خود نگه دارید</p>
                </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-[#2ab3b8] shrink-0 mt-0.5" />
                  <span>بندر عباس، تقاطع رازی، سه راه پلنگ صورتی، پشت بانک صادرات، کوچه دوم جنب چاپخانه سپاهان</span>
                </div>
                <div className="flex flex-col gap-1">
                  <a href="tel:07632220252" className="flex items-center gap-2 text-gray-600 hover:text-[#1a4a8a] transition-colors ltr" dir="ltr">
                    <Phone size={13} className="text-[#2ab3b8] shrink-0" />
                    <span>{toPersianDigits('07632220252')}</span>
                  </a>
                  <a href="tel:07632229600" className="flex items-center gap-2 text-gray-600 hover:text-[#1a4a8a] transition-colors ltr" dir="ltr">
                    <Phone size={13} className="text-[#2ab3b8] shrink-0" />
                    <span>{toPersianDigits('07632229600')}</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {paymentUrl && (
                <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full py-3.5 bg-gradient-to-l from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-sm hover:shadow-xl hover:shadow-green-200 transition-all flex items-center justify-center gap-2">
                  <ExternalLink size={18} /> پرداخت آنلاین
                </a>
              )}
              <div className="flex gap-3">
                <button onClick={() => window.print()}
                  className="flex-1 py-3 bg-gradient-to-l from-[#1a4a8a] to-[#2ab3b8] text-white rounded-2xl font-bold text-sm hover:shadow-xl transition-all flex items-center justify-center gap-2">
                  <Printer size={16} /> پرینت
                </button>
                <button onClick={() => { if (trackingCode) localStorage.removeItem('booking_' + trackingCode); navigate('/', { replace: true }) }}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-medium text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                  <ArrowLeft size={16} /> بازگشت
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-semibold text-gray-700 ${valueClass || ''}`}>{value}</span>
    </div>
  )
}
