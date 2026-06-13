import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { RotateCcw, Trash2, X, Archive, User, Calendar, FileText, DollarSign } from 'lucide-react'
import {
  getAllDeleted,
  restorePatient, permanentDeletePatient, restoreAllPatients, permanentDeleteAllPatients,
  restoreAppointment, permanentDeleteAppointment, restoreAllAppointments, permanentDeleteAllAppointments,
  restoreMedicalRecord, permanentDeleteMedicalRecord, restoreAllMedicalRecords, permanentDeleteAllMedicalRecords,
  restoreBilling, permanentDeleteBilling, restoreAllBillings, permanentDeleteAllBillings,
} from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toJalali, toPersianDigits } from '../utils/jalali'

interface DeletedSection {
  key: string
  label: string
  icon: React.ComponentType<any>
  permission: string
  cols: string[]
  render: (item: any) => string[]
}

export default function DeletedItems() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const { hasPermission } = useAuth()

  const load = async () => {
    setLoading(true)
    try {
      const { data: res } = await getAllDeleted()
      setData(res)
    } catch { toast.error('متأسفانه در دریافت اطلاعات خطایی رخ داد ') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleRestore = async (type: string, id: number, apiCall: () => Promise<any>) => {
    try { await apiCall(); toast.success('مورد با موفقیت به سیستم بازگردانده شد '); load() }
    catch { toast.error('متأسفانه در بازیابی مورد خطایی رخ داد ') }
  }

  const handlePermanentDelete = async (type: string, id: number, apiCall: () => Promise<any>) => {
    if (!window.confirm(`آیا از حذف دائمی این ${type} اطمینان دارید؟ این عمل قابل بازگشت نیست.`)) return
    try { await apiCall(); toast.success('مورد برای همیشه حذف شد '); load() }
    catch { toast.error('متأسفانه در حذف دائمی خطایی رخ داد ') }
  }

  const handleRestoreAll = async (key: string, label: string, apiCall: () => Promise<any>) => {
    if (!window.confirm(`آیا از بازیابی همه ${label} اطمینان دارید؟`)) return
    try { await apiCall(); toast.success(`همه ${label} با موفقیت بازیابی شدند `); load() }
    catch { toast.error('متأسفانه در بازیابی همه موارد خطایی رخ داد ') }
  }

  const handlePermanentDeleteAll = async (key: string, label: string, apiCall: () => Promise<any>) => {
    if (!window.confirm(`آیا از حذف دائمی همه ${label} اطمینان دارید؟ این عمل قابل بازگشت نیست.`)) return
    try { await apiCall(); toast.success(`همه ${label} برای همیشه حذف شدند `); load() }
    catch { toast.error('متأسفانه در حذف دائمی همه موارد خطایی رخ داد ') }
  }

  const sections: DeletedSection[] = [
    { key: 'billings', label: 'صورتحساب‌ها', icon: DollarSign, permission: 'billing',
      cols: ['بیمار', 'مبلغ', 'وضعیت', 'تاریخ حذف'],
      render: (item: any) => [
        item.patient_name || '—',
        toPersianDigits(item.total_amount) + ' تومان',
        item.status === 'paid' ? 'پرداخت شده' : item.status === 'pending' ? 'پرداخت نشده' : 'پرداخت جزئی',
        item.deleted_at ? toJalali(item.deleted_at) : '—',
      ] },
    { key: 'appointments', label: 'نوبت‌ها', icon: Calendar, permission: 'appointments',
      cols: ['بیمار', 'پزشک / درمانگر', 'تاریخ', 'ساعت', 'وضعیت', 'تاریخ حذف'],
      render: (item: any) => [
        item.patient_name || '—',
        item.doctor_name || '—',
        item.date ? toJalali(item.date) : '—',
        item.time ? toPersianDigits(item.time) : '—',
        item.status === 'completed' ? 'انجام شده' : item.status === 'cancelled' ? 'لغو شده' : item.status === 'rescheduled' ? 'تغییر یافته' : 'نوبت‌گذاری شده',
        item.deleted_at ? toJalali(item.deleted_at) : '—',
      ] },
    { key: 'medical_records', label: 'پرونده‌های درمانی', icon: FileText, permission: 'medical_records',
      cols: ['بیمار', 'پزشک / درمانگر', 'جلسه', 'تاریخ حذف'],
      render: (item: any) => [
        item.patient_name || '—',
        item.doctor_name || '—',
        item.session_number ? toPersianDigits(item.session_number) : '—',
        item.deleted_at ? toJalali(item.deleted_at) : '—',
      ] },
    { key: 'patients', label: 'بیماران', icon: User, permission: 'patients',
      cols: ['نام', 'نام خانوادگی', 'کد ملی', 'شماره پرونده', 'تاریخ حذف'],
      render: (item: any) => [
        item.first_name || '—',
        item.last_name || '—',
        item.national_id ? toPersianDigits(item.national_id) : '—',
        item.file_number ? toPersianDigits(item.file_number) : '—',
        item.deleted_at ? toJalali(item.deleted_at) : '—',
      ] },
  ]

  const restoreApi: Record<string, (id: number) => Promise<any>> = {
    patients: (id) => restorePatient(id),
    appointments: (id) => restoreAppointment(id),
    medical_records: (id) => restoreMedicalRecord(id),
    billings: (id) => restoreBilling(id),
  }

  const permanentApi: Record<string, (id: number) => Promise<any>> = {
    patients: (id) => permanentDeletePatient(id),
    appointments: (id) => permanentDeleteAppointment(id),
    medical_records: (id) => permanentDeleteMedicalRecord(id),
    billings: (id) => permanentDeleteBilling(id),
  }

  const restoreAllApi: Record<string, () => Promise<any>> = {
    patients: () => restoreAllPatients(),
    appointments: () => restoreAllAppointments(),
    medical_records: () => restoreAllMedicalRecords(),
    billings: () => restoreAllBillings(),
  }

  const permanentDeleteAllApi: Record<string, () => Promise<any>> = {
    patients: () => permanentDeleteAllPatients(),
    appointments: () => permanentDeleteAllAppointments(),
    medical_records: () => permanentDeleteAllMedicalRecords(),
    billings: () => permanentDeleteAllBillings(),
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2"><Archive size={22} /> موارد حذف شده</h1>
        <button onClick={load} className="btn-secondary whitespace-nowrap">بروزرسانی</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" /></div>
      ) : data ? (
        <div className="space-y-6">
          {sections.map(section => {
            const items = data[section.key] || []
            if (items.length === 0) return null
            const Icon = section.icon
            return (
              <div key={section.key} className="panel card-iranian p-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={18} className="text-brand-500 flex-shrink-0" />
                    <h2 className="text-base font-bold text-slate-700 truncate">{section.label}</h2>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0">{toPersianDigits(items.length)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleRestoreAll(section.key, section.label, restoreAllApi[section.key])}
                      className="btn-action text-green-600"><RotateCcw size={15} /><span>بازیابی همه</span></button>
                    <button onClick={() => handlePermanentDeleteAll(section.key, section.label, permanentDeleteAllApi[section.key])}
                      className="btn-action btn-action-danger"><Trash2 size={15} /><span>حذف همه</span></button>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      {section.cols.map(col => <th key={col} className="text-center">{col}</th>)}
                      <th className="text-center">عملیات</th>
                    </tr></thead>
                    <tbody>
                      {items.map((item: any) => (
                        <tr key={`${section.key}-${item.id}`}>
                          {section.render(item).map((val, i) => <td key={i} className="text-center">{val}</td>)}
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleRestore(section.label, item.id, () => restoreApi[section.key](item.id))}
                                className="btn-action text-green-600" title="بازیابی"><RotateCcw size={16} /><span>بازیابی</span></button>
                              <button onClick={() => handlePermanentDelete(section.label, item.id, () => permanentApi[section.key](item.id))}
                                className="btn-action btn-action-danger" title="حذف دائمی"><Trash2 size={16} /><span>حذف</span></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
          {sections.every(s => (data[s.key] || []).length === 0) && (
            <div className="text-center py-16 text-slate-400">
              <Archive size={48} className="mx-auto mb-3 opacity-30" />
              <p>مورد حذف شده‌ای وجود ندارد</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">خطا در بارگذاری اطلاعات</div>
      )}
    </div>
  )
}
