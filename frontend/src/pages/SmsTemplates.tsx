import React, { useState, useEffect } from 'react'
import { toPersianDigits } from '../utils/jalali'
import { toast } from 'react-toastify'
import { Plus, X, Edit2, Trash2, Save, MessageSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getSmsTemplates, createSmsTemplate, updateSmsTemplate, deleteSmsTemplate
} from '../services/api'

const TEMPLATE_TYPE_OPTIONS = [
  { value: 'confirm', label: 'تأیید نوبت' },
  { value: 'reminder', label: 'یادآوری نوبت' },
  { value: 'payment', label: 'یادآوری پرداخت' },
  { value: 'otp', label: 'کد تایید' },
]

export default function SmsTemplates() {
  const { hasRole } = useAuth()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
    template_type: 'confirm',
    pattern_code: '',
    is_active: true,
  })
  const [saving, setSaving] = useState<boolean>(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getSmsTemplates()
      const data = res.data as any
      setTemplates(Array.isArray(data) ? data : data.results || [])
    } catch (err: any) {
      toast.error('متأسفانه در دریافت قالب‌های پیامک خطایی رخ داد ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openNew = () => {
    setEditingTemplate(null)
    setForm({
      name: '',
      template_type: 'confirm',
      pattern_code: '',
      is_active: true,
    })
    setShowModal(true)
  }

  const openEdit = (t: any) => {
    setEditingTemplate(t.id)
    setForm({
      name: t.name,
      template_type: t.template_type,
      pattern_code: String(t.pattern_code),
      is_active: t.is_active,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا از حذف این قالب اطمینان دارید؟')) return
    try {
      await deleteSmsTemplate(id)
      toast.success('قالب پیامک با موفقیت حذف شد ')
      load()
    } catch (err: any) {
      toast.error('متأسفانه در حذف قالب خطایی رخ داد ')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.pattern_code.trim()) {
      toast.error('لطفاً همه فیلدهای الزامی را پر کنید ')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        template_type: form.template_type,
        pattern_code: form.pattern_code,
        is_active: form.is_active,
      }

      if (editingTemplate) {
        await updateSmsTemplate(editingTemplate, payload)
        toast.success(`قالب ${form.name} با موفقیت ویرایش شد `)
      } else {
        await createSmsTemplate(payload)
        toast.success(`قالب ${form.name} با موفقیت اضافه شد `)
      }

      setShowModal(false)
      load()
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'متأسفانه در ذخیره قالب خطایی رخ داد '
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const option = TEMPLATE_TYPE_OPTIONS.find(o => o.value === type)
    return option ? option.label : type
  }

  const getUsedTypes = () => {
    return new Set(templates.map(t => t.template_type))
  }

  if (!hasRole('admin')) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">دسترسی به این صفحه فقط برای مدیر کلینیک امکان‌پذیر است.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-extrabold text-slate-800">قالب‌های پیامک</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> قالب جدید
        </button>
      </div>

      <div className="panel card-iranian">
        <div className="panel-body">
          <p className="text-sm text-slate-500 mb-4">
            برای استفاده از روش ارسال الگو (Shared) که از خطوط خدماتی با اولویت بالا استفاده می‌کند،
            ابتدا الگو مربوطه را در پنل ملی پیامک بسازید و bodyId الگو را در اینجا وارد کنید.
            پارامترها (args) به ترتیب تعریف شده در الگو جایگزین می‌شوند.
          </p>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
              <p>هنوز الگوی پیامکی تعریف نشده است</p>
              <p className="text-xs mt-1">با کلیک روی "الگوی جدید" اولین الگوی خود را اضافه کنید</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>نام قالب</th>
                    <th>نوع</th>
                    <th>شناسه الگو (bodyId)</th>
                    <th>وضعیت</th>
                    <th className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(t => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.name}</td>
                      <td>{getTypeLabel(t.template_type)}</td>
                      <td dir="ltr" className="font-mono">{t.pattern_code}</td>
                      <td>
                        <span className={`status-badge ${t.is_active ? 'active' : 'inactive'}`}>
                          <span className="dot"></span>
                          {t.is_active ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-center gap-1">
                          <button onClick={() => openEdit(t)} className="action-btn" title="ویرایش">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="action-btn danger" title="حذف">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>



      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-slate-800">
                  {editingTemplate ? 'ویرایش الگو' : 'الگوی جدید'}
                </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">نام قالب (برای نمایش در سیستم)</label>
                <input
                  className="input-field"
                  placeholder="مثال: قالب تأیید نوبت"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">نوع قالب</label>
                <select
                  className="input-field"
                  value={form.template_type}
                  onChange={e => setForm({ ...form, template_type: e.target.value })}
                  required
                >
                  {TEMPLATE_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                      {getUsedTypes().has(opt.value) && opt.value !== form.template_type && ' (قبلاً تعریف شده)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                  <label className="label">شناسه الگو (bodyId) در ملی پیامک</label>
                  <input
                    className="input-field ltr"
                    placeholder="مثال: 12345"
                    value={form.pattern_code}
                    onChange={e => setForm({ ...form, pattern_code: e.target.value })}
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    bodyId الگو را از پنل ملی پیامک کپی کنید (بخش مدیریت الگوها)
                  </p>
                </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700 cursor-pointer">
                  این الگو فعال باشد (برای هر نوع فقط یک الگو فعال می‌تواند باشد)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50"
                >
                  {saving ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> در حال ذخیره...</>
                  ) : (
                    <><Save size={16} /> ذخیره</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
