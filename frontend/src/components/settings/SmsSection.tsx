import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { MessageSquare, Send, Save, RefreshCw, CreditCard } from 'lucide-react'
import { getSmsSettings, updateSmsSettings, testSmsConnection, getSmsCredit, getSmsTemplates, createSmsTemplate, updateSmsTemplate, deleteSmsTemplate } from '../../services/api'
import Button from '../Button'
import type { SmsTemplate } from '../../types'

interface SmsSectionProps {
  templates: SmsTemplate[]
  setTemplates: (templates: SmsTemplate[]) => void
  setSmsSettingsModal: (modal: { visible: boolean; mode: string }) => void
}

const TEMPLATE_TYPE_OPTIONS = [
  { value: 'confirm', label: 'تأیید نوبت' },
  { value: 'reminder', label: 'یادآوری نوبت' },
  { value: 'payment', label: 'یادآوری پرداخت' },
  { value: 'otp', label: 'کد تایید' },
]

export default function SmsSection({ templates, setTemplates, setSmsSettingsModal }: SmsSectionProps) {
  const [smsApiKey, setSmsApiKey] = useState('')
  const [smsApiBase, setSmsApiBase] = useState('https://console.melipayamak.com/api')
  const [smsLineNumber, setSmsLineNumber] = useState('')
  const [credit, setCredit] = useState<number | null>(null)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '', template_type: 'confirm', pattern_code: '', is_active: true,
  })

  useEffect(() => {
    getSmsSettings().then(({ data }) => {
      setSmsApiKey((data as any).sms_api_key || '')
      setSmsApiBase((data as any).sms_api_base || 'https://console.melipayamak.com/api')
      setSmsLineNumber((data as any).sms_line_number || '')
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSmsSettings({
        sms_api_key: smsApiKey,
        sms_line_number: smsLineNumber,
      } as any)
      toast.success('تنظیمات پیامک با موفقیت ذخیره شد')
    } catch {
      toast.error('خطا در ذخیره تنظیمات پیامک')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const { data } = await testSmsConnection(smsApiKey)
      if ((data as any).success) {
        toast.success(`اتصال برقرار شد - اعتبار: ${(data as any).credit} ریال`)
      } else {
        toast.error((data as any).error || 'خطا در اتصال')
      }
    } catch {
      toast.error('عدم امکان اتصال به سامانه ملی پیامک')
    } finally {
      setTesting(false)
    }
  }

  const handleCredit = async () => {
    try {
      const { data } = await getSmsCredit()
      if ((data as any).success) {
        setCredit((data as any).credit)
        toast.success(`اعتبار شما: ${(data as any).credit} ریال`)
      } else {
        toast.error((data as any).error || 'خطا در دریافت اعتبار')
      }
    } catch {
      toast.error('خطا در دریافت اعتبار')
    }
  }

  const openNewTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm({ name: '', template_type: 'confirm', pattern_code: '', is_active: true })
    setShowTemplateModal(true)
  }

  const openEditTemplate = (t: SmsTemplate) => {
    setEditingTemplate(t.id)
    setTemplateForm({
      name: t.name,
      template_type: t.type || 'confirm',
      pattern_code: String((t as any).pattern_code || ''),
      is_active: (t as any).is_active !== false,
    })
    setShowTemplateModal(true)
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!window.confirm('آیا از حذف این قالب اطمینان دارید؟')) return
    try {
      await deleteSmsTemplate(id)
      toast.success('قالب پیامک با موفقیت حذف شد')
      const { data } = await getSmsTemplates()
      setTemplates(Array.isArray(data) ? data : (data as any).results || [])
    } catch {
      toast.error('خطا در حذف قالب')
    }
  }

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateForm.name.trim() || !templateForm.pattern_code.trim()) {
      toast.error('لطفاً همه فیلدها را پر کنید')
      return
    }
    try {
      const payload = {
        name: templateForm.name,
        type: templateForm.template_type,
        pattern_code: templateForm.pattern_code,
        is_active: templateForm.is_active,
      }
      if (editingTemplate) {
        await updateSmsTemplate(editingTemplate, payload as any)
      } else {
        await createSmsTemplate(payload as any)
      }
      toast.success('قالب پیامک ذخیره شد')
      setShowTemplateModal(false)
      const { data } = await getSmsTemplates()
      setTemplates(Array.isArray(data) ? data : (data as any).results || [])
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'خطا در ذخیره قالب'
      toast.error(msg)
    }
  }

  const getTypeLabel = (type?: string) => {
    const opt = TEMPLATE_TYPE_OPTIONS.find(o => o.value === type)
    return opt ? opt.label : type || type || ''
  }

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <h3 className="flex items-center gap-2"><MessageSquare size={18} className="text-brand-500" /> تنظیمات سرویس پیامک (ملی پیامک)</h3>
        </div>
        <div className="panel-body space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            ارائه‌دهنده پیش‌فرض: <strong>ملی پیامک (Melipayamak)</strong>
          </div>
          <div className="form-grid">
            <div>
              <label className="label">API Key (توکن)</label>
              <input className="input-field ltr" type="password" value={smsApiKey} onChange={e => setSmsApiKey(e.target.value)} placeholder="توکن دریافتی از پنل ملی پیامک" dir="ltr" />
            </div>
            <div>
              <label className="label">آدرس API</label>
              <input className="input-field ltr" value={smsApiBase} onChange={e => setSmsApiBase(e.target.value)} placeholder="https://console.melipayamak.com/api" dir="ltr" />
            </div>
            <div>
              <label className="label">شماره خط ارسال</label>
              <input className="input-field ltr" value={smsLineNumber} onChange={e => setSmsLineNumber(e.target.value)} placeholder="5000xxx (فقط برای ارسال ساده)" dir="ltr" />
              <p className="text-[11px] text-slate-400 mt-1">برای ارسال الگو (Shared) نیازی به خط نیست</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} icon={Save} loading={saving}>ذخیره تنظیمات</Button>
            <Button variant="secondary" icon={RefreshCw} onClick={handleTest} loading={testing}>تست اتصال</Button>
            <Button variant="secondary" icon={CreditCard} onClick={handleCredit}>مشاهده اعتبار</Button>
            <Button variant="secondary" icon={Send} onClick={() => setSmsSettingsModal({ visible: true, mode: 'send' })}>ارسال آزمایشی</Button>
          </div>
          {credit !== null && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
              اعتبار فعلی: {credit} ریال
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="flex items-center gap-2"><MessageSquare size={18} className="text-brand-500" /> قالب‌های پیامک (الگوهای ملی پیامک)</h3>
        </div>
        <div className="panel-body space-y-3">
          <p className="text-sm text-slate-500">
            برای استفاده از روش ارسال الگو (Shared) ابتدا الگو را در پنل ملی پیامک بسازید و bodyId آن را در اینجا وارد کنید.
            پارامترها به ترتیب تعریف شده در الگو جایگزین می‌شوند.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">{templates.length} قالب</span>
            <Button variant="secondary" icon={MessageSquare} onClick={openNewTemplate}>قالب جدید</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-right p-2">نام قالب</th>
                  <th className="text-right p-2">نوع</th>
                  <th className="text-right p-2">bodyId</th>
                  <th className="text-right p-2">وضعیت</th>
                  <th className="text-left p-2">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr><td colSpan={5} className="text-center p-4 text-slate-400">هنوز الگویی تعریف نشده</td></tr>
                ) : templates.map(t => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="p-2 font-medium">{t.name}</td>
                    <td className="p-2">{getTypeLabel(t.type)}</td>
                    <td className="p-2 font-mono" dir="ltr">{(t as any).pattern_code}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${(t as any).is_active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {(t as any).is_active !== false ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="p-2 text-left">
                      <div className="inline-flex gap-1">
                        <Button size="xs" variant="ghost" onClick={() => openEditTemplate(t)}>ویرایش</Button>
                        <Button size="xs" variant="ghost" className="text-red-500" onClick={() => handleDeleteTemplate(t.id)}>حذف</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200">
              <h4 className="font-bold text-lg">{editingTemplate ? 'ویرایش قالب' : 'قالب جدید'}</h4>
            </div>
            <form onSubmit={handleSaveTemplate} className="p-4 space-y-3">
              <div>
                <label className="label">نام قالب</label>
                <input className="input-field" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="مثال: قالب تأیید نوبت" required />
              </div>
              <div>
                <label className="label">نوع قالب</label>
                <select className="input-field" value={templateForm.template_type} onChange={e => setTemplateForm({ ...templateForm, template_type: e.target.value })}>
                  {TEMPLATE_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">شناسه الگو (bodyId)</label>
                <input className="input-field ltr" value={templateForm.pattern_code} onChange={e => setTemplateForm({ ...templateForm, pattern_code: e.target.value })} placeholder="مثال: 12345" dir="ltr" required />
                <p className="text-[11px] text-slate-400 mt-1">bodyId را از پنل ملی پیامک کپی کنید</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="templateActive" checked={templateForm.is_active} onChange={e => setTemplateForm({ ...templateForm, is_active: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="templateActive" className="text-sm">فعال</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" icon={Save}>ذخیره</Button>
                <Button variant="ghost" type="button" onClick={() => setShowTemplateModal(false)}>انصراف</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
