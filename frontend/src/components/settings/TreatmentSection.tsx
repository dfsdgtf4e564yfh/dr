import { useState } from 'react'
import { toast } from 'react-toastify'
import { PanelRightOpen, Pencil, Trash2, Plus, Save, X } from 'lucide-react'
import api from '../../services/api'
import Button from '../Button'

interface TreatmentItem {
  id: number
  name: string
  description?: string
  price?: string | number
  category?: string
  duration?: number
  is_active?: boolean
}

interface TreatmentSectionProps {
  treatments: TreatmentItem[]
  setTreatments: (treatments: TreatmentItem[]) => void
}

export default function TreatmentSection({ treatments, setTreatments }: TreatmentSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editTreatment, setEditTreatment] = useState<TreatmentItem | null>(null)
  const [treatmentForm, setTreatmentForm] = useState({
    name: '', description: '', price: '', category: '', duration: 30, is_active: true,
  })
  const [treatmentSearch, setTreatmentSearch] = useState('')

  const fetchTreatments = async () => {
    try {
      const { data } = await api.get('/auth/treatment-types/')
      setTreatments(Array.isArray(data) ? data : (data as any).results || [])
    } catch { setTreatments([]) }
  }

  const resetForm = () => {
    setTreatmentForm({ name: '', description: '', price: '', category: '', duration: 30, is_active: true })
    setEditTreatment(null)
    setShowForm(false)
  }

  const openEdit = (t: TreatmentItem) => {
    setEditTreatment(t)
    setTreatmentForm({ name: t.name, description: t.description || '', price: t.price?.toString() || '', category: t.category || '', duration: t.duration || 30, is_active: t.is_active ?? true })
    setShowForm(true)
  }

  const saveTreatment = async () => {
    if (!treatmentForm.name) return
    try {
      if (editTreatment) {
        await api.patch('/auth/treatment-types/' + editTreatment.id + '/', treatmentForm)
        toast.success(`خدمت ${treatmentForm.name} با موفقیت ویرایش شد `)
      } else {
        await api.post('/auth/treatment-types/', treatmentForm)
        toast.success(`خدمت ${treatmentForm.name} با موفقیت اضافه شد `)
      }
      resetForm()
      fetchTreatments()
    } catch { toast.error('متأسفانه در ذخیره خدمت خطایی رخ داد ') }
  }

  const deleteTreatment = async (id: number) => {
    if (!window.confirm('حذف شود؟')) return
    try { await api.delete('/auth/treatment-types/' + id + '/'); toast.success('خدمت با موفقیت حذف شد '); fetchTreatments() }
    catch { toast.error('متأسفانه در حذف خدمت خطایی رخ داد ') }
  }

  const filteredTreatments = treatments.filter(t =>
    !treatmentSearch || t.name?.includes(treatmentSearch) || t.category?.includes(treatmentSearch)
  )

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="flex items-center gap-2"><PanelRightOpen size={18} className="text-brand-500" /> انواع خدمات</h3>
        <Button size="xs" variant="secondary" icon={Plus} onClick={() => resetForm()}>خدمت جدید</Button>
      </div>
      <div className="panel-body space-y-3">
        {showForm && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-blue-800">{editTreatment ? 'ویرایش خدمت' : 'خدمت جدید'}</h4>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
              <div>
                <label className="label">نام خدمت</label>
                <input className="input-field" placeholder="مثال: ویزیت عمومی" value={treatmentForm.name} onChange={e => setTreatmentForm({ ...treatmentForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">دسته‌بندی</label>
                <input className="input-field" placeholder="مثال: ویزیت" value={treatmentForm.category} onChange={e => setTreatmentForm({ ...treatmentForm, category: e.target.value })} />
              </div>
              <div>
                <label className="label">قیمت (تومان)</label>
                <input className="input-field" type="number" placeholder="۲۰۰۰۰۰" value={treatmentForm.price} onChange={e => setTreatmentForm({ ...treatmentForm, price: e.target.value })} />
              </div>
              <div>
                <label className="label">مدت زمان (دقیقه)</label>
                <input className="input-field" type="number" min={5} max={240} value={treatmentForm.duration} onChange={e => setTreatmentForm({ ...treatmentForm, duration: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">توضیحات</label>
                <input className="input-field" placeholder="توضیحات..." value={treatmentForm.description} onChange={e => setTreatmentForm({ ...treatmentForm, description: e.target.value })} />
              </div>
              <div className="flex items-end pb-3 h-full">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="treatmentActive" checked={treatmentForm.is_active} onChange={e => setTreatmentForm({ ...treatmentForm, is_active: e.target.checked })} />
                  <label htmlFor="treatmentActive" className="text-sm">فعال</label>
                </div>
              </div>
            </div>
            <Button onClick={saveTreatment} icon={Save}>{editTreatment ? 'بروزرسانی خدمت' : 'افزودن خدمت'}</Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <input className="input-field" placeholder="جستجوی خدمات..." value={treatmentSearch} onChange={e => setTreatmentSearch(e.target.value)} />
          </div>
          <div className="text-left">
            <span className="text-sm text-slate-500">{filteredTreatments.length} خدمت</span>
          </div>
        </div>

        {filteredTreatments.length === 0 ? (
          <div className="text-center py-8 text-slate-400"><p>خدمتی یافت نشد</p><p className="text-xs mt-1">برای افزودن خدمت جدید، دکمه بالا را بزنید.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTreatments.map(t => (
              <div key={t.id} className="border border-slate-200 rounded-xl p-3 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm">{t.name}</h4>
                    {t.category && <span className="text-xs text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full mt-1 inline-block">{t.category}</span>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500"><Pencil size={14} /></button>
                    <button onClick={() => deleteTreatment(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  {t.price && <p><span className="font-mono">{Number(t.price).toLocaleString()}</span> تومان</p>}
                  {t.duration && <p>{t.duration} دقیقه</p>}
                  {t.description && <p className="text-slate-400 truncate">{t.description}</p>}
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${t.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{t.is_active !== false ? 'فعال' : 'غیرفعال'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
