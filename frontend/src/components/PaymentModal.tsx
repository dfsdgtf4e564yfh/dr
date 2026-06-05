import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { DollarSign } from 'lucide-react'
import { createBilling, updateBilling, payBalance, getBillings } from '../services/api'
import { formatMoney, toEnglishDigits, toJalali } from '../utils/jalali'
import Modal from './Modal'
import Button from './Button'
import type { Appointment } from '../types'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  appointment?: Appointment | null
  balancePatient?: any
  onSuccess?: () => void
}

export default function PaymentModal({ open, onClose, appointment, balancePatient, onSuccess }: PaymentModalProps) {
  const isBalance = !!balancePatient
  const [billingId, setBillingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    total_amount: '', paid_amount: '', amount: '',
    payment_method: 'cash', receipt_number: '', description: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (isBalance && balancePatient) {
      const bal = (parseInt(balancePatient.total_billed) || 0) - (parseInt(balancePatient.total_paid) || 0)
      setForm({ total_amount: '', paid_amount: '', amount: String(bal), payment_method: 'cash', receipt_number: '', description: '' })
      setBillingId(null)
    } else if (appointment) {
      const total = (parseInt(appointment.cost as any || 0) + parseInt((appointment as any).service_cost || 0)).toString()
      setForm({ total_amount: total, paid_amount: total, amount: '', payment_method: 'cash', receipt_number: '', description: '' })
      setBillingId(null)
      getBillings({ appointment: appointment.id }).then(({ data }) => {
        const existing = Array.isArray(data) ? data[0] : (data as any).results?.[0]
        if (existing) {
          setBillingId(existing.id)
          setForm({
            total_amount: existing.total_amount,
            paid_amount: existing.paid_amount,
            amount: '',
            payment_method: existing.payment_method,
            receipt_number: existing.receipt_number || '',
            description: existing.description || '',
          })
        }
      }).catch(() => {})
    }
  }, [open, appointment, balancePatient, isBalance])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isBalance) {
        const paidAmount = Number(form.amount)
        if (!paidAmount || paidAmount <= 0) {
          toast.error('لطفاً مبلغ پرداخت را وارد کنید ')
          setSaving(false)
          return
        }
        const { data } = await payBalance({
          patient_id: balancePatient.patient_id,
          amount: paidAmount,
          payment_method: form.payment_method,
          receipt_number: form.receipt_number || '',
        })
        if (data.remaining_balance > 0) {
          toast.success(`${data.paid.toLocaleString()} تومان با موفقیت پرداخت شد  ${data.remaining_balance.toLocaleString()} تومان باقی ماند`)
        } else {
          toast.success('تسویه حساب کامل انجام شد ')
        }
      } else if (appointment) {
        const payload: any = {
          patient: appointment.patient,
          doctor: appointment.doctor,
          appointment: appointment.id,
          total_amount: form.total_amount,
          paid_amount: form.paid_amount,
          payment_method: form.payment_method,
          receipt_number: form.receipt_number || '',
          description: form.description,
          status: Number(form.paid_amount) >= Number(form.total_amount) ? 'paid' : 'partial',
        }
        if (billingId) {
          await updateBilling(billingId, payload)
          toast.success('صورتحساب با موفقیت به‌روزرسانی شد ')
        } else {
          await createBilling(payload)
          toast.success('پرداخت با موفقیت ثبت شد ')
        }
      }
      onClose()
      onSuccess?.()
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.non_field_errors?.[0] || 'متأسفانه در ثبت پرداخت خطایی رخ داد '
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const numInput = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [key]: toEnglishDigits(e.target.value).replace(/[^0-9]/g, '') })
  }

  const showReceipt = form.payment_method === 'card' || form.payment_method === 'transfer'

  return (
    <Modal open={open} onClose={onClose} size="sm" title={isBalance ? 'پرداخت مانده حساب' : 'ثبت پرداخت'}>
      <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2">
        {isBalance ? (
          <>
            <div className="flex justify-between text-sm"><span className="text-slate-500">بیمار:</span><span className="font-bold text-slate-800">{balancePatient.patient_name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">جمع صورت‌حساب:</span><span className="font-bold text-slate-800">{formatMoney(parseInt(balancePatient.total_billed) || 0)} تومان</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">پرداخت شده:</span><span className="font-bold text-green-600">{formatMoney(parseInt(balancePatient.total_paid) || 0)} تومان</span></div>
            {(() => { const bal = (parseInt(balancePatient.total_billed) || 0) - (parseInt(balancePatient.total_paid) || 0); return (
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2 mt-2">
                <span className="text-slate-500 font-bold">مانده حساب:</span>
                <span className={`font-bold ${bal > 0 ? 'text-red-500' : 'text-green-600'}`}>{formatMoney(bal)} تومان</span>
              </div>
            )})()}
          </>
        ) : appointment ? (
          <>
            <div className="flex justify-between text-sm"><span className="text-slate-500">بیمار:</span><span className="font-bold text-slate-800">{appointment.patient_name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">پزشک:</span><span className="font-bold text-slate-800">{appointment.doctor_name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">تاریخ:</span><span className="font-bold text-slate-800">{appointment.date ? toJalali(appointment.date) : '-'}</span></div>
          </>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isBalance ? (
          <div>
            <label className="label">مبلغ پرداخت (تومان)</label>
            <input type="text" className="input-field" value={formatMoney(form.amount)} onChange={numInput('amount')} required />
          </div>
        ) : (
          <>
            <div>
              <label className="label">مبلغ صورتحساب (تومان)</label>
              <input type="text" className="input-field" value={formatMoney(form.total_amount)} onChange={numInput('total_amount')} required />
            </div>
            <div>
              <label className="label">مبلغ پرداخت شده (تومان)</label>
              <input type="text" className="input-field" value={formatMoney(form.paid_amount)} onChange={numInput('paid_amount')} required />
            </div>
          </>
        )}

        <div>
          <label className="label">روش پرداخت</label>
          <select className="input-field" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
            <option value="cash">نقدی</option>
            <option value="card">کارت</option>
            <option value="insurance">بیمه</option>
            <option value="transfer">کارت به کارت</option>
          </select>
        </div>

        {showReceipt && (
          <div>
            <label className="label">شماره رسید</label>
            <input className="input-field ltr" dir="ltr" placeholder="شماره رسید (اختیاری)"
              value={form.receipt_number} onChange={e => setForm({ ...form, receipt_number: e.target.value })} />
          </div>
        )}

        <div>
          <label className="label">توضیحات</label>
          <textarea className="input-field" rows={2} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} placeholder="توضیح (اختیاری)" />
        </div>

        <Button type="submit" variant="gradient" className="w-full" loading={saving} icon={DollarSign}>
          {billingId ? 'به‌روزرسانی پرداخت' : 'تأیید پرداخت'}
        </Button>
      </form>
    </Modal>
  )
}
