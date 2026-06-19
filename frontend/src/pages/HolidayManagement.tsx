import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { getHolidays, createHoliday, deleteHoliday } from '../services/api'
import { toJalali, toPersianDigits } from '../utils/jalali'

interface Holiday {
  id: number
  date: string
  reason: string
  is_active: boolean
}

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getHolidays()
      setHolidays(Array.isArray(data) ? data : [])
    } catch { toast.error('خطا در دریافت تعطیلات') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!date) { toast.error('تاریخ را وارد کنید'); return }
    try {
      await createHoliday({ date, reason, is_active: true })
      toast.success('تعطیلی با موفقیت افزوده شد')
      setDate(''); setReason('')
      load()
    } catch { toast.error('خطا در ثبت تعطیلی') }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteHoliday(id)
      toast.success('تعطیلی حذف شد')
      load()
    } catch { toast.error('خطا در حذف تعطیلی') }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold text-slate-800">مدیریت تعطیلات</h1>

      <div className="panel">
        <div className="panel-header">
          <h3 className="flex items-center gap-2"><Calendar size={16} /> افزودن تعطیلی جدید</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">تاریخ</label>
              <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">دلیل (اختیاری)</label>
              <input className="input-field" value={reason} onChange={e => setReason(e.target.value)} placeholder="مناسبت..." />
            </div>
            <div className="flex items-end">
              <button onClick={handleAdd} className="px-5 py-2 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition flex items-center gap-2">
                <Plus size={18} /> افزودن
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="flex items-center gap-2"><Calendar size={16} /> لیست تعطیلات</h3>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-8"><span className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>
          ) : holidays.length === 0 ? (
            <p className="text-center text-slate-400 py-8">هیچ تعطیلی ثبت نشده</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-center py-3 px-2 font-semibold text-slate-600">ردیف</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-600">تاریخ</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-600">دلیل</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-600">وضعیت</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-600">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((h, i) => (
                    <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 text-slate-500">{i + 1}</td>
                      <td className="py-3 px-2">{toJalali(h.date)}</td>
                      <td className="py-3 px-2 text-slate-600">{h.reason || '—'}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {h.is_active ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-left">
                        <button onClick={() => handleDelete(h.id)} className="text-red-500 hover:text-red-700 transition p-1">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
