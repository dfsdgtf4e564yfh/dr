import React from 'react'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Plus, Edit2, Trash2, MessageSquare, DollarSign, ExternalLink, RefreshCw } from 'lucide-react'
import { getBillings, createBilling, updateBilling, deleteBilling, restoreBilling, requestOnlinePayment } from '../services/api'
import { getDoctors } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toJalali, toPersianDigits, formatMoney, toEnglishDigits } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'
import SmsSendModal from '../components/SmsSendModal'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import PatientSearchSelect from '../components/PatientSearchSelect'
import ConfirmDialog from '../components/ConfirmDialog'
import { undoToast } from '../utils/toast'

export default function Billing() {
  const [billings, setBillings] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editing, setEditing] = useState<any>(null)
  const [filters, setFilters] = useState<any>({ status: '', date_from: '', date_to: '' })
  const [doctors, setDoctors] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const { user, hasRole } = useAuth()
  const [form, setForm] = useState<any>({
    patient: '', doctor: '', appointment: '', cost_type: 'visit', total_amount: '', paid_amount: 0,
    payment_method: 'cash', doctor_commission_percentage: 0, status: 'pending', description: '',
  })
  const [showSmsModal, setShowSmsModal] = useState<boolean>(false)
  const [smsPatientId, setSmsPatientId] = useState<any>(null)
  const [smsAmount, setSmsAmount] = useState<number>(0)
  const [smsBillingAppointmentId, setSmsBillingAppointmentId] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [editRefId, setEditRefId] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filters.status) params.status = filters.status
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      const res = await getBillings(params)
      const data = res.data as any
      setBillings(data.results || data)
    } catch { toast.error('متأسفانه در دریافت صورتحساب‌ها مشکلی پیش اومد ') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters])
  useEffect(() => {
    getDoctors().then(({ data }: any) => setDoctors(Array.isArray(data) ? data : data.results || [])).catch(() => {})
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ patient: '', doctor: '', appointment: '', cost_type: 'visit', total_amount: '', paid_amount: 0, payment_method: 'cash', doctor_commission_percentage: 0, status: 'pending', description: '' })
    setEditRefId('')
    setSearchTerm('')
    setShowModal(true)
  }

  const openEdit = (b: any) => {
    setEditing(b.id)
    setForm({
      patient: b.patient, doctor: b.doctor, appointment: b.appointment || '',
      cost_type: b.cost_type || 'visit', total_amount: b.total_amount, paid_amount: b.paid_amount,
      payment_method: b.payment_method,
      doctor_commission_percentage: b.doctor_commission_percentage, status: b.status, description: b.description || '',
    })
    setEditRefId(b.ref_id || '')
    setSearchTerm(b.patient_name)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.payment_method === 'online' && form.status === 'paid' && !editRefId) {
      toast.error('پرداخت آنلاین تأیید نشده است. ابتدا از طریق درگاه پرداخت اقدام کنید.')
      return
    }
    try {
      const payload: any = {
        ...form,
        total_amount: parseInt(form.total_amount),
        paid_amount: parseInt(form.paid_amount),
        doctor_commission_percentage: parseFloat(form.doctor_commission_percentage),
      }
      if (!payload.appointment) delete payload.appointment
      if (editing) {
        await updateBilling(editing, payload)
        toast.success('صورتحساب با موفقیت ویرایش شد ')
      } else {
        await createBilling(payload)
        toast.success('صورتحساب جدید با موفقیت ثبت شد ')
      }
      setShowModal(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'متأسفانه خطایی در ثبت صورتحساب رخ داد ')
    }
  }

  const handleDelete = (id: any) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const deletedId = deleteConfirm
      await deleteBilling(deletedId)
      undoToast('صورتحساب حذف شد', async () => {
        try {
          await restoreBilling(deletedId)
          toast.success('صورتحساب با موفقیت بازگردانی شد ')
          load()
        } catch {
          toast.error('خطا در بازگردانی صورتحساب')
        }
      }, 8000)
      load()
    } catch { toast.error('متأسفانه در حذف صورتحساب مشکلی پیش اومد ') }
    finally { setDeleting(false); setDeleteConfirm(null) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-extrabold text-slate-800">مدیریت صورتحساب‌ها</h1>
        <div className="flex gap-2 flex-wrap">
          {hasRole('admin', 'reception') && (
            <Button onClick={openNew} icon={Plus}>صورتحساب جدید</Button>
          )}
        </div>
      </div>

      <div className="panel card-iranian">
        <div className="panel-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select className="input-field" value={filters.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">همه وضعیت‌ها</option>
              <option value="paid">پرداخت شده</option>
              <option value="pending">پرداخت نشده</option>
              <option value="partial">پرداخت جزئی</option>
            </select>
            <JalaliDateInput value={filters.date_from} onChange={(v: any) => setFilters({ ...filters, date_from: v })} />
            <JalaliDateInput value={filters.date_to} onChange={(v: any) => setFilters({ ...filters, date_to: v })} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="panel card-iranian"><SkeletonTable rows={6} cols={9} /></div>
      ) : billings.length === 0 ? (
        <EmptyState icon={DollarSign} title="صورتحسابی یافت نشد" description="صورتحسابی با فیلترهای فعلی وجود ندارد." />
      ) : (
        <div className="panel card-iranian">
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th className="text-center">بیمار</th>
                <th className="text-center">پزشک / درمانگر</th>
                <th className="text-center">نوع</th>
                <th className="text-center">مبلغ کل</th>
                <th className="text-center">پرداختی</th>
                <th className="text-center">روش</th>
                <th className="text-center">وضعیت</th>
                <th className="text-center">تاریخ</th>
                <th className="text-center">عملیات</th>
              </tr></thead>
              <tbody>
                {billings.map((b: any) => (
                  <tr key={b.id}>
                    <td className="text-center">{b.patient_name}</td>
                    <td className="text-center">{b.doctor_name}</td>
                    <td className="text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${b.cost_type === 'visit' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>{b.cost_type === 'visit' ? 'ویزیت' : 'خدمات'}</span></td>
                    <td className="text-center">{formatMoney(b.total_amount)}</td>
                    <td className="text-center">{formatMoney(b.paid_amount)}</td>
                    <td className="text-center">{b.payment_method === 'cash' ? 'نقدی' : b.payment_method === 'card' ? 'کارت' : b.payment_method === 'insurance' ? 'بیمه' : 'کارت به کارت'}</td>
                    <td className="text-center"><StatusBadge status={b.status} /></td>
                    <td className="text-center">{toJalali(b.created_at)}</td>
                    <td className="text-center">
                      <div className="flex justify-center gap-1">
                        {(b.status === 'pending' || b.status === 'partial') && (
                          <button onClick={async () => {
                            try {
                              const { data } = await requestOnlinePayment(b.id)
                              window.open(data.payment_url, '_blank')
                            } catch { toast.error('خطا در اتصال به درگاه پرداخت') }
                          }} className="action-btn text-emerald-600" title="پرداخت آنلاین"><ExternalLink size={14} /></button>
                        )}
                        {b.payment_url && (
                          <button onClick={() => {
                            window.open(b.payment_url, '_blank')
                          }} className="action-btn text-amber-600" title="بررسی وضعیت پرداخت"><RefreshCw size={14} /></button>
                        )}
                         <button onClick={() => { setSmsPatientId(b.patient); setSmsAmount(b.pending_amount || b.total_amount); setSmsBillingAppointmentId(b.appointment || null); setShowSmsModal(true) }} className="action-btn" title="یادآوری پرداخت"><MessageSquare size={14} /></button>
                        {hasRole('admin', 'reception') && (
                          <button onClick={() => openEdit(b)} className="action-btn" title="ویرایش"><Edit2 size={14} /></button>
                        )}
                        {hasRole('admin') && (
                          <button onClick={() => handleDelete(b.id)} className="action-btn danger" title="حذف"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} size="md" title={editing ? 'ویرایش صورتحساب' : 'صورتحساب جدید'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">بیمار</label>
            <PatientSearchSelect
              value={searchTerm}
              onSelect={(p: any) => { setForm({ ...form, patient: p.id }); setSearchTerm(`${p.first_name} ${p.last_name}`) }}
              minChars={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">پزشک / درمانگر</label>
              <select className="input-field" value={form.doctor} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const selected = doctors.find((d: any) => d.id === Number(e.target.value))
                setForm({ ...form, doctor: e.target.value, doctor_commission_percentage: selected?.commission_percentage || 0 })
              }} required>
                <option value="">انتخاب</option>
                {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name} ({toPersianDigits(d.commission_percentage || 0)}%)</option>)}
              </select>
            </div>
            <div><label className="label">روش پرداخت</label>
              <select className="input-field" value={form.payment_method} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, payment_method: e.target.value })}>
                <option value="cash">نقدی</option><option value="card">کارت</option><option value="insurance">بیمه</option><option value="transfer">کارت به کارت</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">نوع هزینه</label>
              <select className="input-field" value={form.cost_type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, cost_type: e.target.value })}>
                <option value="visit">ویزیت</option>
                <option value="service">خدمات</option>
              </select>
            </div>
            <div><label className="label">مبلغ کل (تومان)</label><input type="text" className="input-field" value={formatMoney(form.total_amount)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, total_amount: toEnglishDigits(e.target.value).replace(/[^0-9]/g, '') })} required /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">مبلغ پرداختی</label><input type="text" className="input-field" value={formatMoney(form.paid_amount)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, paid_amount: toEnglishDigits(e.target.value).replace(/[^0-9]/g, '') })} /></div>
            <div><label className="label">درصد سهم پزشک / درمانگر</label><input type="number" className="input-field" value={form.doctor_commission_percentage} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, doctor_commission_percentage: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="label">وضعیت</label>
              <select className="input-field" value={form.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, status: e.target.value })}>
                <option value="pending">پرداخت نشده</option>
                <option value="paid" disabled={form.payment_method === 'online' && !editRefId}>پرداخت شده</option>
                <option value="partial">پرداخت جزئی</option>
              </select>
              {form.payment_method === 'online' && !editRefId && (
                <p className="text-xs text-amber-500 mt-1">پرداخت آنلاین هنوز تأیید نشده است. تا تأیید درگاه، نمی‌توان پرداخت شده را انتخاب کرد.</p>
              )}
            </div>
          </div>
          <div><label className="label">توضیحات</label><textarea className="input-field" rows={2} value={form.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })} /></div>
          <Button type="submit" variant="gradient" className="w-full">{editing ? 'ذخیره' : 'ثبت'}</Button>
        </form>
      </Modal>

      <SmsSendModal
        show={showSmsModal}
        onClose={() => { setShowSmsModal(false); setSmsPatientId(null); setSmsAmount(0); setSmsBillingAppointmentId(null) }}
        type="payment"
        patientId={smsPatientId}
        amount={smsAmount}
        billingAppointmentId={smsBillingAppointmentId}
        onSuccess={load}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="حذف صورتحساب"
        message="آیا از حذف این صورتحساب اطمینان دارید؟ این عملیات قابل بازگشت نیست."
        confirmLabel="حذف کن"
        cancelLabel="انصراف"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
