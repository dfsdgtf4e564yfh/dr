import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Plus, Edit2, Trash2, Save, FileText, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import PatientSearchSelect from '../components/PatientSearchSelect'
import {
  getVisitTemplates, createVisitTemplate, updateVisitTemplate,
  deleteVisitTemplate, applyVisitTemplate,
} from '../services/api'

import type { VisitTemplate, Patient } from '../types'

const CATEGORY_OPTIONS = [
  { value: 'neurology', label: 'نورولوژی' },
  { value: 'psychiatry', label: 'روانپزشکی' },
  { value: 'general', label: 'عمومی' },
]

const CATEGORY_LABELS: Record<string, string> = {
  neurology: 'نورولوژی',
  psychiatry: 'روانپزشکی',
  general: 'عمومی',
}

export default function VisitTemplates() {
  const { hasPermission } = useAuth()
  const [templates, setTemplates] = useState<VisitTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [applyTemplateId, setApplyTemplateId] = useState<number | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [applying, setApplying] = useState(false)
  const [form, setForm] = useState<{
    title: string
    category: 'neurology' | 'psychiatry' | 'general'
    diagnosis_template: string
    treatment_plan_template: string
    notes_template: string
    prescription_template: string
  }>({
    title: '',
    category: 'general',
    diagnosis_template: '',
    treatment_plan_template: '',
    notes_template: '',
    prescription_template: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await getVisitTemplates()
      setTemplates(Array.isArray(res.data) ? res.data : (res.data as any).results || [])
    } catch {
      toast.error('خطا در دریافت قالب‌های ویزیت')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditingId(null)
    setForm({ title: '', category: 'general', diagnosis_template: '', treatment_plan_template: '', notes_template: '', prescription_template: '' })
    setShowModal(true)
  }

  const openEdit = (t: VisitTemplate) => {
    setEditingId(t.id)
    setForm({
      title: t.title,
      category: t.category,
      diagnosis_template: t.diagnosis_template,
      treatment_plan_template: t.treatment_plan_template,
      notes_template: t.notes_template,
      prescription_template: t.prescription_template,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا از حذف این قالب اطمینان دارید؟')) return
    try {
      await deleteVisitTemplate(id)
      toast.success('قالب ویزیت با موفقیت حذف شد')
      load()
    } catch {
      toast.error('خطا در حذف قالب')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('عنوان قالب الزامی است')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await updateVisitTemplate(editingId, form)
        toast.success('قالب ویزیت با موفقیت ویرایش شد')
      } else {
        await createVisitTemplate(form)
        toast.success('قالب ویزیت با موفقیت ایجاد شد')
      }
      setShowModal(false)
      load()
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'خطا در ذخیره قالب'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const openApply = (id: number) => {
    setApplyTemplateId(id)
    setSelectedPatient(null)
    setApplyModalOpen(true)
  }

  const handleApply = async () => {
    if (!applyTemplateId || !selectedPatient) return
    setApplying(true)
    try {
      await applyVisitTemplate(applyTemplateId, { patient_id: selectedPatient.id })
      toast.success('قالب ویزیت با موفقیت اعمال شد')
      setApplyModalOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'خطا در اعمال قالب')
    } finally {
      setApplying(false)
    }
  }

  if (!hasPermission('medical_record_templates')) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">دسترسی به این صفحه محدود شده است.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="قالب‌های ویزیت" icon={FileText}>
        {hasPermission('visit_templates') && (
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> قالب جدید
          </button>
        )}
      </PageHeader>

      <div className="panel card-iranian">
        <div className="panel-body">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FileText size={48} className="mx-auto mb-3 opacity-30" />
              <p>هنوز قالبی تعریف نشده است</p>
              <p className="text-xs mt-1">با کلیک روی "قالب جدید" اولین قالب را اضافه کنید</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>تخصص</th>
                    <th>ایجاد کننده</th>
                    <th>تاریخ ایجاد</th>
                    <th className="text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(t => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.title}</td>
                      <td>{CATEGORY_LABELS[t.category] || t.category}</td>
                      <td className="text-slate-500">{t.created_by_name || ''}</td>
                      <td className="text-slate-500 text-sm" dir="ltr">{t.created_at?.slice(0, 10)}</td>
                      <td>
                        <div className="flex justify-center gap-1">
                          {hasPermission('visit_templates_apply') && (
                            <button onClick={() => openApply(t.id)} className="action-btn" title="اعمال قالب">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {hasPermission('visit_templates') && (
                            <>
                              <button onClick={() => openEdit(t)} className="action-btn" title="ویرایش">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDelete(t.id)} className="action-btn danger" title="حذف">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'ویرایش قالب ویزیت' : 'قالب ویزیت جدید'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">عنوان قالب</label>
              <input className="input-field" placeholder="مثال: ویزیت اولیه نورولوژی" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">تخصص</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as 'neurology' | 'psychiatry' | 'general' })} required>
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">الگوی تشخیص</label>
            <textarea className="input-field" rows={3} value={form.diagnosis_template} onChange={e => setForm({ ...form, diagnosis_template: e.target.value })} />
          </div>
          <div>
            <label className="label">الگوی طرح درمان</label>
            <textarea className="input-field" rows={3} value={form.treatment_plan_template} onChange={e => setForm({ ...form, treatment_plan_template: e.target.value })} />
          </div>
          <div>
            <label className="label">الگوی یادداشت</label>
            <textarea className="input-field" rows={3} value={form.notes_template} onChange={e => setForm({ ...form, notes_template: e.target.value })} />
          </div>
          <div>
            <label className="label">الگوی نسخه</label>
            <textarea className="input-field" rows={3} value={form.prescription_template} onChange={e => setForm({ ...form, prescription_template: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">
              انصراف
            </button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50">
              {saving ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> در حال ذخیره...</> : <><Save size={16} /> ذخیره</>}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={applyModalOpen} onClose={() => setApplyModalOpen(false)} title="اعمال قالب ویزیت" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">بیمار مورد نظر برای اعمال قالب را انتخاب کنید:</p>
          <PatientSearchSelect onSelect={(p) => setSelectedPatient(p)} placeholder="جستجوی بیمار..." />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setApplyModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">
              انصراف
            </button>
            <button onClick={handleApply} disabled={!selectedPatient || applying} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50">
              {applying ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> در حال اعمال...</> : <><CheckCircle size={16} /> اعمال قالب</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
