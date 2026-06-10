import { useState } from 'react'
import { toast } from 'react-toastify'
import { CreditCard, Globe, Save } from 'lucide-react'
import { getOnlineBookingSettings, updateOnlineBookingSettings } from '../../services/api'

export default function OnlineBookingSection() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    getOnlineBookingSettings().then(({ data }) => {
      setSettings(typeof data === 'object' ? data : {})
      setLoaded(true)
    }).catch(() => setLoaded(true))
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
            <label className="label">نام پزشک</label>
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

        <button onClick={handleSave} disabled={loading}
          className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 disabled:opacity-50 transition flex items-center gap-2">
          {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={18} />}
          ذخیره تنظیمات
        </button>
      </div>
    </div>
  )
}
