import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Plus, X, Edit3, Trash2, Pill, Stethoscope, ClipboardList } from 'lucide-react'
import {
  getCommonDiagnoses, createCommonDiagnosis, updateCommonDiagnosis, deleteCommonDiagnosis,
  getCommonDrugs, createCommonDrug, updateCommonDrug, deleteCommonDrug,
  getCommonTreatmentPlans, createCommonTreatmentPlan, updateCommonTreatmentPlan, deleteCommonTreatmentPlan,
} from '../services/api'

interface TabConfigApi {
  get: (...args: any[]) => Promise<any>
  create: (...args: any[]) => Promise<any>
  update: (...args: any[]) => Promise<any>
  delete: (...args: any[]) => Promise<any>
}

interface TabConfig {
  title: string
  api: TabConfigApi
  emptyMsg: string
  emptyForm: Record<string, string>
  editForm: (item: any) => Record<string, string>
  tableHeaders: string[]
  tableCells: (item: any) => string[]
  modalFields: React.FC<{ form: Record<string, string>; setForm: React.Dispatch<React.SetStateAction<Record<string, string>>> }>
}

interface TabInfo {
  id: string
  label: string
  icon: React.FC<any>
}

const tabs: TabInfo[] = [
  { id: 'diagnosis', label: 'تشخیص‌های آماده', icon: Stethoscope },
  { id: 'drug', label: 'داروهای آماده', icon: Pill },
  { id: 'treatment', label: 'طرح‌های درمان', icon: ClipboardList },
]

const config: Record<string, TabConfig> = {
  diagnosis: {
    title: 'تشخیص',
    api: { get: getCommonDiagnoses, create: createCommonDiagnosis, update: updateCommonDiagnosis, delete: deleteCommonDiagnosis },
    emptyMsg: 'تشخیصی ثبت نشده',
    emptyForm: { title: '', description: '' },
    editForm: (item) => ({ title: item.title, description: item.description || '' }),
    tableHeaders: ['ردیف', 'عنوان تشخیص', 'توضیحات'],
    tableCells: (item) => [item.title, item.description || '—'],
    modalFields: ({ form, setForm }: { form: Record<string, string>; setForm: React.Dispatch<React.SetStateAction<Record<string, string>>> }) => (
      <>
        <div><label className="label">عنوان تشخیص</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
        <div><label className="label">توضیحات</label><textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      </>
    ),
  },
  drug: {
    title: 'دارو',
    api: { get: getCommonDrugs, create: createCommonDrug, update: updateCommonDrug, delete: deleteCommonDrug },
    emptyMsg: 'دارویی ثبت نشده',
    emptyForm: { name: '', dosage_unit: 'میلی‌گرم', default_dosage: '' },
    editForm: (item) => ({ name: item.name, dosage_unit: item.dosage_unit, default_dosage: item.default_dosage || '' }),
    tableHeaders: ['ردیف', 'نام دارو', 'واحد مقدار', 'مقدار پیش‌فرض'],
    tableCells: (item) => [item.name, item.dosage_unit, item.default_dosage || '—'],
    modalFields: ({ form, setForm }: { form: Record<string, string>; setForm: React.Dispatch<React.SetStateAction<Record<string, string>>> }) => (
      <>
        <div><label className="label">نام دارو</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">واحد مقدار</label><input className="input-field" value={form.dosage_unit} onChange={e => setForm({ ...form, dosage_unit: e.target.value })} /></div>
        <div><label className="label">مقدار پیش‌فرض</label><input className="input-field" value={form.default_dosage} onChange={e => setForm({ ...form, default_dosage: e.target.value })} /></div>
      </>
    ),
  },
  treatment: {
    title: 'طرح درمان',
    api: { get: getCommonTreatmentPlans, create: createCommonTreatmentPlan, update: updateCommonTreatmentPlan, delete: deleteCommonTreatmentPlan },
    emptyMsg: 'طرح درمانی ثبت نشده',
    emptyForm: { title: '', description: '' },
    editForm: (item) => ({ title: item.title, description: item.description || '' }),
    tableHeaders: ['ردیف', 'عنوان طرح درمان', 'توضیحات'],
    tableCells: (item) => [item.title, item.description || '—'],
    modalFields: ({ form, setForm }: { form: Record<string, string>; setForm: React.Dispatch<React.SetStateAction<Record<string, string>>> }) => (
      <>
        <div><label className="label">عنوان طرح درمان</label><input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
        <div><label className="label">توضیحات</label><textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      </>
    ),
  },
}

export default function DiagnosisDrugs() {
  const [tab, setTab] = useState('diagnosis')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const cfg = config[tab]

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await cfg.api.get()
      setItems(Array.isArray(data) ? data : data.results || [])
    } catch { toast.error('متأسفانه در دریافت اطلاعات خطایی رخ داد ') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [tab])

  const openNew = () => {
    setEditing(null)
    setForm({ ...cfg.emptyForm })
    setShowModal(true)
  }

  const openEdit = (item: any) => {
    setEditing(item.id)
    setForm(cfg.editForm(item))
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await cfg.api.update(editing, form)
        toast.success(`${cfg.title} با موفقیت ویرایش شد `)
      } else {
        await cfg.api.create(form)
        toast.success(`${cfg.title} جدید با موفقیت اضافه شد `)
      }
      setShowModal(false)
      loadData()
    } catch { toast.error('متأسفانه در ثبت خطایی رخ داد ') }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا از حذف این مورد اطمینان دارید؟')) return
    try {
      await cfg.api.delete(id)
      toast.success(`${cfg.title} با موفقیت حذف شد `)
      loadData()
    } catch { toast.error('متأسفانه در حذف خطایی رخ داد ') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت تشخیص، دارو و طرح درمان</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> {cfg.title} جدید
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" /></div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">{cfg.emptyMsg}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-slate-600">
              {cfg.tableHeaders.map(h => (
                <th key={h} className={`text-right py-3 px-2 ${h === 'عملیات' ? 'text-center' : ''}`}>{h}</th>
              ))}
              <th className="text-center py-3 px-2">عملیات</th>
            </tr></thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-2 text-slate-400">{i + 1}</td>
                  {cfg.tableCells(item).map((cell, ci) => (
                    <td key={ci} className="py-3 px-2 font-medium">{cell}</td>
                  ))}
                  <td className="text-center py-3 px-2">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="ویرایش"><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? 'ویرایش' : cfg.title + ' جدید'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <cfg.modalFields form={form} setForm={setForm} />
              <button type="submit" className="btn-primary w-full">{editing ? 'ذخیره تغییرات' : 'ثبت'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
