import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { CreditCard, Globe, Save, Stethoscope, Plus, X, Clock, Phone, Mail } from 'lucide-react'
import { getOnlineBookingSettings, updateOnlineBookingSettings, getTreatmentTypes, createTreatmentType, updateTreatmentType, deleteTreatmentType } from '../../services/api'

interface OnlineBookingSectionProps {
  treatments?: any[]
  onTreatmentsChange?: (treatments: any[]) => void
}

export default function OnlineBookingSection({ treatments: externalTreatments, onTreatmentsChange }: OnlineBookingSectionProps) {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const [internalTreatments, setInternalTreatments] = useState<any[]>([])
  const [pricesChanged, setPricesChanged] = useState(false)
  const [pricesSaving, setPricesSaving] = useState(false)
  const [newTreatName, setNewTreatName] = useState('')
  const [newTreatPrice, setNewTreatPrice] = useState('')
  const [showNewTreat, setShowNewTreat] = useState(false)
  const [newSlot, setNewSlot] = useState('')

  const treatments = externalTreatments ?? internalTreatments
  const setTreatments = onTreatmentsChange
    ? (t: any[] | ((prev: any[]) => any[])) => {
        const next = typeof t === 'function' ? t(treatments) : t
        onTreatmentsChange(next)
        setInternalTreatments(next)
      }
    : setInternalTreatments

  useEffect(() => {
    getOnlineBookingSettings().then(({ data }) => {
      setSettings(typeof data === 'object' ? data : {})
      setLoaded(true)
    }).catch(() => setLoaded(true))
    loadTreatments()
  }, [])

  const loadTreatments = () => {
    getTreatmentTypes().then(({ data }) => {
      const list = Array.isArray(data) ? data : data.results || data
      setTreatments(list)
    }).catch(() => {})
  }

  const updateTreatmentPrice = (id: number, price: string) => {
    setTreatments(prev => prev.map(t => t.id === id ? { ...t, price: parseInt(price) || 0 } : t))
    setPricesChanged(true)
  }

  const savePrices = async () => {
    setPricesSaving(true)
    try {
      for (const t of treatments) {
        await updateTreatmentType(t.id, { price: t.price })
      }
      toast.success('قیمت‌ها با موفقیت ذخیره شدند')
      setPricesChanged(false)
    } catch { toast.error('خطا در ذخیره قیمت‌ها') }
    finally { setPricesSaving(false) }
  }

  const addTreatment = async () => {
    if (!newTreatName.trim()) { toast.error('نام درمان را وارد کنید'); return }
    try {
      await createTreatmentType({ name: newTreatName.trim(), price: parseInt(newTreatPrice) || 0 })
      toast.success('درمان جدید اضافه شد')
      setNewTreatName(''); setNewTreatPrice(''); setShowNewTreat(false)
      loadTreatments()
    } catch { toast.error('خطا در افزودن درمان') }
  }

  const removeTreatment = async (id: number) => {
    try {
      await deleteTreatmentType(id)
      toast.success('درمان حذف شد')
      loadTreatments()
    } catch { toast.error('خطا در حذف درمان') }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateOnlineBookingSettings(settings)
      toast.success('تنظیمات نوبت‌دهی آنلاین ذخیره شد')
    } catch { toast.error('خطا در ذخیره تنظیمات') }
    finally { setLoading(false) }
  }

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }))

  return (
    <div className="panel">
      <div className="panel-header"><h3 className="flex items-center gap-2"><Globe size={16} /> تنظیمات نوبت‌دهی آنلاین</h3></div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">نام پزشک / درمانگر</label>
            <input className="input-field" value={settings.doctor_name || ''} onChange={e => update('doctor_name', e.target.value)} />
          </div>
          <div>
            <label className="label">تخصص</label>
            <input className="input-field" value={settings.specialty || ''} onChange={e => update('specialty', e.target.value)} />
          </div>
          <div>
            <label className="label">شعار</label>
            <input className="input-field" value={settings.tagline || ''} onChange={e => update('tagline', e.target.value)} />
          </div>
          <div>
            <label className="label">تلفن</label>
            <input className="input-field" value={settings.phone || ''} onChange={e => update('phone', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">آدرس</label>
            <textarea className="input-field" rows={2} value={settings.address || ''} onChange={e => update('address', e.target.value)} />
          </div>
          <div>
            <label className="label">تلفن ۲</label>
            <input className="input-field" value={settings.phone2 || ''} onChange={e => update('phone2', e.target.value)} />
          </div>
          <div>
            <label className="label">ایمیل</label>
            <input className="input-field" dir="ltr" value={settings.email || ''} onChange={e => update('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input className="input-field" value={settings.instagram || ''} onChange={e => update('instagram', e.target.value)} />
          </div>
          <div>
            <label className="label">Google Maps</label>
            <input className="input-field" value={settings.google_maps || ''} onChange={e => update('google_maps', e.target.value)} />
          </div>
          <div>
            <label className="label">Waze</label>
            <input className="input-field" value={settings.waze || ''} onChange={e => update('waze', e.target.value)} />
          </div>
          <div>
            <label className="label">Balad</label>
            <input className="input-field" value={settings.balad || ''} onChange={e => update('balad', e.target.value)} />
          </div>
          <div>
            <label className="label">Neshan</label>
            <input className="input-field" value={settings.neshan || ''} onChange={e => update('neshan', e.target.value)} />
          </div>
          <div>
            <label className="label">ساعت شروع کار</label>
            <input className="input-field" type="time" value={settings.work_start || '16:00'} onChange={e => update('work_start', e.target.value)} />
          </div>
          <div>
            <label className="label">ساعت پایان کار</label>
            <input className="input-field" type="time" value={settings.work_end || '22:00'} onChange={e => update('work_end', e.target.value)} />
          </div>
        </div>

        {/* Time slots */}
        <hr className="border-slate-200" />
        <div>
          <h4 className="font-bold text-sm flex items-center gap-2 mb-3"><Clock size={16} /> ساعت‌های نوبت‌دهی</h4>
          <p className="text-xs text-slate-400 mb-3">ساعت‌های قابل انتخاب برای نوبت را مشخص کنید. برای اضافه کردن ساعت جدید، آن را تایپ کرده و دکمه افزودن را بزنید.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(() => {
              const slots = (settings.time_slots || '').split(',').filter(Boolean)
              return slots.length === 0 ? <span className="text-xs text-slate-400 py-1">ساعتی تعریف نشده</span> : slots.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-sm">
                  {s}
                  <button onClick={() => {
                    const list = slots.filter((_, j) => j !== i)
                    update('time_slots', list.join(','))
                  }} className="text-red-400 hover:text-red-600 transition"><X size={13} /></button>
                </span>
              ))
            })()}
          </div>
          <div className="flex items-center gap-2">
            <input className="input-field w-32 text-center" type="time" value={newSlot} onChange={e => setNewSlot(e.target.value)} />
            <button onClick={() => {
              if (!newSlot) { toast.error('ساعت را وارد کنید'); return }
              const slots = (settings.time_slots || '').split(',').filter(Boolean)
              if (slots.includes(newSlot)) { toast.error('این ساعت قبلاً اضافه شده'); return }
              slots.push(newSlot)
              slots.sort()
              update('time_slots', slots.join(','))
              setNewSlot('')
            }} className="px-3 py-2 bg-brand-500 text-white rounded-lg text-xs hover:bg-brand-600 transition flex items-center gap-1">
              <Plus size={14} /> افزودن
            </button>
          </div>
        </div>

        <hr className="border-slate-200" />

        <h4 className="font-bold text-sm flex items-center gap-2"><CreditCard size={16} /> تنظیمات درگاه پرداخت</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Merchant ID زرین‌پال</label>
            <input className="input-field ltr" dir="ltr" value={settings.zarinpal_merchant || ''} onChange={e => update('zarinpal_merchant', e.target.value)} placeholder="۰۱۲۳۴۵۶۷-۸۹۰۱-۲۳۴۵-۶۷۸۹-۰۱۲۳۴۵۶۷۸۹۰۱" />
            <p className="text-xs text-slate-400 mt-1">خالی بگذارید = پرداخت آنلاین غیرفعال</p>
          </div>
        </div>

        <hr className="border-slate-200" />

        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm flex items-center gap-2"><Stethoscope size={16} /> قیمت‌گذاری خدمات</h4>
          <button onClick={() => setShowNewTreat(true)} className="text-xs px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition flex items-center gap-1">
            <Plus size={14} /> افزودن خدمت
          </button>
        </div>

        {showNewTreat && (
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2">
            <input className="input-field flex-1 text-sm" placeholder="نام خدمت" value={newTreatName} onChange={e => setNewTreatName(e.target.value)} />
            <input className="input-field w-28 text-sm" placeholder="قیمت (تومان)" value={newTreatPrice} onChange={e => setNewTreatPrice(e.target.value.replace(/\D/g, ''))} />
            <button onClick={addTreatment} className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition">افزودن</button>
            <button onClick={() => { setShowNewTreat(false); setNewTreatName(''); setNewTreatPrice('') }} className="p-2 hover:bg-slate-200 rounded-lg transition"><X size={16} className="text-slate-400" /></button>
          </div>
        )}

        {treatments.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">نام خدمت</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold text-slate-500">قیمت (تومان)</th>
                  <th className="text-center px-4 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {treatments.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 text-slate-700">{t.name}</td>
                    <td className="px-4 py-2">
                      <input className="input-field text-sm w-32 text-left ltr" dir="ltr"
                        value={t.price || 0}
                        onChange={e => updateTreatmentPrice(t.id, e.target.value.replace(/\D/g, ''))} />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => removeTreatment(t.id)} className="p-1 hover:bg-red-50 rounded-lg transition" title="حذف">
                        <X size={14} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pricesChanged && (
          <div className="flex justify-end">
            <button onClick={savePrices} disabled={pricesSaving}
              className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition flex items-center gap-2">
              {pricesSaving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
              ذخیره قیمت‌ها
            </button>
          </div>
        )}

        <button onClick={handleSave} disabled={loading}
          className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2">
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={18} />}
          ذخیره تنظیمات
        </button>
      </div>
    </div>
  )
}
