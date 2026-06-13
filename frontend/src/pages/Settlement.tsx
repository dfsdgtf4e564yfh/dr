import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { createPortal } from 'react-dom'
import { Plus, X, Edit3, Trash2 } from 'lucide-react'
import { getSettlements, createSettlement, updateSettlement, deleteSettlement, getDoctors, getDoctorBalance } from '../services/api'
import { toJalali, toPersianDigits, formatMoney, toEnglishDigits } from '../utils/jalali'

export default function Settlement() {
  const [settlements, setSettlements] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ doctor: '', amount: '', notes: '' })
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [s, d] = await Promise.all([getSettlements(), getDoctors()])
      const sd = s.data as any
      const dd = d.data as any
      setSettlements(Array.isArray(sd) ? sd : sd.results || [])
      setDoctors(Array.isArray(dd) ? dd : dd.results || [])
    } catch (err: any) { toast.error('متأسفانه در دریافت اطلاعات تسویه حساب خطایی رخ داد ') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const fetchBalance = async (doctorId: string) => {
    if (!doctorId) { setBalance(null); return }
    setBalanceLoading(true)
    try {
      const { data } = await getDoctorBalance(Number(doctorId))
      setBalance(data.balance)
    } catch { setBalance(null) }
    finally { setBalanceLoading(false) }
  }

  const openNew = () => {
    setEditing(null)
    setForm({ doctor: '', amount: '', notes: '' })
    setBalance(null)
    setShowModal(true)
  }

  const openEdit = (s: any) => {
    setEditing(s.id)
    setForm({ doctor: s.doctor, amount: String(s.amount), notes: s.notes || '' })
    fetchBalance(String(s.doctor))
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { doctor: Number(form.doctor), amount: parseInt(form.amount), notes: form.notes }
      if (editing) {
        await updateSettlement(editing, payload)
        toast.success('تسویه حساب با موفقیت ویرایش شد')
      } else {
        await createSettlement(payload)
        toast.success('تسویه حساب جدید با موفقیت ثبت شد')
      }
      setShowModal(false)
      load()
    } catch (err: any) { toast.error('متأسفانه خطایی در ثبت تسویه حساب رخ داد ') }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا از حذف این تسویه حساب اطمینان دارید؟')) return
    try {
      await deleteSettlement(id)
      toast.success('تسویه حساب با موفقیت حذف شد')
      load()
    } catch (err: any) { toast.error('متأسفانه در حذف تسویه حساب مشکلی پیش اومد ') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">تسویه حساب پزشکان</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2"><Plus size={18} /> تسویه جدید</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-600">
              <th className="text-center py-3 px-2">پزشک / درمانگر</th>
              <th className="text-center py-3 px-2">مبلغ</th>
              <th className="text-center py-3 px-2">تاریخ</th>
              <th className="text-center py-3 px-2">یادداشت</th>
              <th className="text-center py-3 px-2">عملیات</th>
            </tr></thead>
            <tbody>
              {settlements.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">تسویه‌ای ثبت نشده</td></tr>
              ) : settlements.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2">{s.doctor_name}</td>
                  <td className="py-3 px-2 font-medium">{formatMoney(s.amount)} تومان</td>
                  <td className="py-3 px-2">{toJalali(s.date || s.created_at)}</td>
                  <td className="py-3 px-2 text-gray-500">{s.notes || '—'}</td>
                  <td className="text-center py-3 px-2">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="ویرایش"><Edit3 size={16} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editing ? 'ویرایش تسویه' : 'تسویه جدید'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">پزشک / درمانگر</label>
                <select className="input-field" value={form.doctor} onChange={e => { setForm({ ...form, doctor: e.target.value }); fetchBalance(e.target.value) }} required>
                  <option value="">انتخاب</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
                </select>
                {form.doctor && (
                  <div className="mt-2 p-3 rounded-xl bg-surface-50 border border-surface-200 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-surface-500">موجودی:</span>
                      <span className={`font-bold ${balance !== null && balance < 0 ? 'text-red-500' : 'text-surface-800'}`}>
                        {balanceLoading ? 'در حال بارگذاری...' : balance !== null ? `${formatMoney(balance)} تومان` : '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div><label className="label">مبلغ (تومان)</label><input type="text" className="input-field" value={formatMoney(form.amount)} onChange={e => setForm({ ...form, amount: toEnglishDigits(e.target.value).replace(/[^0-9]/g, '') })} required /></div>
              <div><label className="label">یادداشت</label><textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <button type="submit" className="btn-primary w-full">{editing ? 'ذخیره تغییرات' : 'ثبت تسویه'}</button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
