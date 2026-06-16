import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { handleApiError } from '../utils/apiError'
import { Plus, Ban, Calendar, Printer, MessageSquare, ChevronDown, ChevronUp, Wallet, Trash2, Search, Calendar as CalendarIcon } from 'lucide-react'
import { getAppointments, createAppointment, updateAppointment, cancelAppointment, deleteAppointment, getPatientGroupedAppointments } from '../services/api'
import { createBilling } from '../services/api'
import { getDoctors, getTreatmentTypes, getClinicSettings } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toJalali, toPersianDigits, smartPersianDigits, toEnglishDigits, formatMoney, escapeHtml } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'
import SmsSendModal from '../components/SmsSendModal'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import PatientSearchSelect from '../components/PatientSearchSelect'
import PaymentModal from '../components/PaymentModal'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Appointments() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [editing, setEditing] = useState<any>(null)
  const [filters, setFilters] = useState<any>({
    status: searchParams.get('status') || '',
    doctor: searchParams.get('doctor') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    search: searchParams.get('search') || '',
  })
  const [doctors, setDoctors] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const searchTimer = useRef<any>(null)
  const [form, setForm] = useState<any>({ patient: '', doctor: '', treatment_type: '', date: '', time: '', cost: '', service_cost: '', status: 'scheduled', notes: '' })
  const [totalCount, setTotalCount] = useState<number>(0)
  const [errors, setErrors] = useState<any>({})
  const { hasRole, hasPermission } = useAuth()
  const [clinicSettings, setClinicSettings] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)
  const [paymentApp, setPaymentApp] = useState<any>(null)
  const [showSmsModal, setShowSmsModal] = useState<boolean>(false)
  const [smsAppointmentId, setSmsAppointmentId] = useState<any>(null)
  const [groupedData, setGroupedData] = useState<any[]>([])
  const [expandedPatients, setExpandedPatients] = useState<any>({})
  const [showBalanceModal, setShowBalanceModal] = useState<boolean>(false)
  const [balancePatient, setBalancePatient] = useState<any>(null)
  const [confirmCancel, setConfirmCancel] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<any>(null)

  const load = useCallback(async (skipLoading = false) => {
    if (!skipLoading) setLoading(true)
    try {
      const params: any = {}
      if (filters.status) params.status = filters.status
      if (filters.doctor) params.doctor = filters.doctor
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (filters.search) params.search = filters.search
      const { data } = await getPatientGroupedAppointments(params) as { data: any }
      const list = Array.isArray(data) ? data : data.results || []
      setGroupedData(list)
      setTotalCount(list.reduce((sum: number, g: any) => sum + g.appointments.length, 0))
    } catch (err: any) { handleApiError(err, 'متأسفانه در دریافت نوبت‌ها مشکلی پیش اومد') }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    getDoctors().then(({ data }: any) => setDoctors(Array.isArray(data) ? data : data.results || data)).catch((err: any) => handleApiError(err, 'خطا در دریافت لیست پزشکان'))
    getTreatmentTypes().then(({ data }: any) => setTreatments(Array.isArray(data) ? data : data.results || data)).catch((err: any) => handleApiError(err, 'خطا در دریافت نوع درمان'))
    getClinicSettings().then(({ data }: any) => {
      setClinicSettings(Array.isArray(data) ? data[0] : data)
    }).catch((err: any) => handleApiError(err, 'خطا در دریافت تنظیمات'))
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ patient: '', doctor: '', treatment_type: '', date: '', time: '', cost: '', service_cost: '', status: 'scheduled', notes: '' })
    setSearchTerm('')
    setSearchInput('')
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (app: any) => {
    setEditing(app.id)
    setForm({
      patient: app.patient,
      doctor: app.doctor,
      treatment_type: app.treatment_type,
      date: app.date,
      time: app.time,
      cost: app.cost || '',
      service_cost: app.service_cost || '',
      status: app.status,
      notes: app.notes,
    })
    setSearchTerm(app.patient_name)
    setSearchInput(app.patient_name)
    setErrors({})
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      if (editing) {
        await updateAppointment(editing, form)
        toast.success('نوبت با موفقیت ویرایش و به‌روزرسانی شد ')
      } else {
        const { data: newApp } = await createAppointment(form) as { data: any }
        const billingPromises: Promise<any>[] = []
        if (form.cost && parseInt(form.cost) > 0) {
          billingPromises.push(createBilling({
            patient: form.patient,
            doctor: form.doctor,
            appointment: newApp.id,
            total_amount: parseInt(form.cost),
            paid_amount: 0,
            cost_type: 'visit',
            payment_method: 'cash' as const,
            status: 'pending',
            description: 'هزینه ویزیت',
          } as any).catch((err: any) => handleApiError(err)))
        }
        if (form.service_cost && parseInt(form.service_cost) > 0) {
          billingPromises.push(createBilling({
            patient: form.patient,
            doctor: form.doctor,
            appointment: newApp.id,
            total_amount: parseInt(form.service_cost),
            paid_amount: 0,
            cost_type: 'service',
            payment_method: 'cash' as const,
            status: 'pending',
            description: 'هزینه خدمات',
          } as any).catch((err: any) => handleApiError(err)))
        }
        await Promise.all(billingPromises)
        toast.success('نوبت جدید با موفقیت ثبت و برنامه‌ریزی شد ')
      }
      setShowModal(false)
      load(true)
    } catch (err: any) {
      const resp = err.response?.data
      if (resp && typeof resp === 'object') {
        if (resp.detail) {
          toast.error(resp.detail)
        } else {
          setErrors(resp)
          const first = Object.values(resp).flat().join('؛ ')
          if (first) toast.error(first)
        }
      } else {
        toast.error('متأسفانه در ثبت نوبت مشکلی پیش اومد  لطفاً مجدد تلاش کنید')
      }
    }
  }

  const handleCancel = async (id: any) => {
    try {
      await cancelAppointment(id)
      toast.success('نوبت با موفقیت لغو شد')
      load()
    } catch (err: any) { handleApiError(err, 'متأسفانه در لغو نوبت مشکلی پیش اومد') }
    finally { setConfirmCancel(null) }
  }

  const handleDelete = async (id: any) => {
    try {
      await deleteAppointment(id)
      toast.success('نوبت مورد نظر با موفقیت حذف شد ')
      load()
    } catch (err: any) { handleApiError(err, 'متأسفانه در حذف نوبت مشکلی پیش اومد') }
    finally { setConfirmDelete(null) }
  }

  const openPaymentModal = async (app: any) => {
    setPaymentApp(app)
    setShowPaymentModal(true)
  }

  const printReceipt = (a: any, settings: any) => {
    const h = (s: string) => escapeHtml(s)
    const clinicPhone = settings?.phone || ''
    const clinicPhone2 = settings?.phone2 || ''
    const clinicPhone3 = settings?.phone3 || ''
    const clinicAddress = settings?.address || ''
    const win = window.open('', '', 'width=450,height=650')
    const statusText = a.status === 'scheduled' ? `نوبت گذاری شده به شماره ${toPersianDigits(a.daily_number || '')}` : a.status === 'completed' ? 'انجام شده' : a.status === 'cancelled' ? 'لغو شده' : 'تغییر یافته'
    const clinicName = h(settings?.clinic_name) || 'کلینیک تخصصی اعصاب و روان دکتر محمد طاهری'
    win!.document.write(`<html dir="rtl"><head><title>قبض نوبت</title>
    <style>
      @page { size: A5; margin: 0.8cm; }
      @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-Regular.woff2') format('woff2'); font-weight: 400; }
      @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); font-weight: 700; }
      @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); font-weight: 800; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.6; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      .receipt { width: 100%; max-width: 400px; padding: 16px; border: 2px solid #000; }
      .header { text-align: center; margin-bottom: 14px; }
      .header h1 { font-size: 16px; font-weight: 800; color: #4f46e5; margin-bottom: 3px; }
      .header p { font-size: 10px; color: #94a3b8; }
      .divider { border: none; border-top: 2px dashed #e2e8f0; margin: 12px 0; }
      .info-box { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 12px; background: #f8fafc; }
      .row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #e2e8f0; }
      .row:last-child { border-bottom: none; }
      .label { font-size: 10px; color: #94a3b8; font-weight: 400; }
      .value { font-size: 11px; color: #1e293b; font-weight: 700; text-align: left; }
      .status-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; background: #eef2ff; color: #4f46e5; }
      .footer { text-align: center; border-top: 1.5px dashed #e2e8f0; padding-top: 10px; margin-top: 4px; }
      .footer p { font-size: 9px; color: #94a3b8; line-height: 1.5; }
      @media print { body { margin: 0; } }
    </style></head>
    <body><div class="receipt">
      <div class="header"><h1>${clinicName}</h1></div>
      <hr class="divider">
      <div class="info-box">
        <div class="row"><span class="label">بیمار</span><span class="value">${h(a.patient_name)}</span></div>
        <div class="row"><span class="label">شماره نوبت</span><span class="value">${toPersianDigits(a.daily_number || '')}</span></div>
        <div class="row"><span class="label">پزشک / درمانگر</span><span class="value">${h(a.doctor_name)}</span></div>
        <div class="row"><span class="label">نوع درمان</span><span class="value">${h(a.treatment_name) || '—'}</span></div>
        <div class="row"><span class="label">تاریخ</span><span class="value">${toJalali(a.date)}</span></div>
        <div class="row"><span class="label">ساعت</span><span class="value">${h(a.time)}</span></div>
        <div class="row"><span class="label">وضعیت</span><span class="value"><span class="status-badge">${statusText}</span></span></div>
      </div>
      <div class="footer">
        <p>لطفاً ۱۵ دقیقه قبل از نوبت حضور داشته باشید</p>
        ${clinicAddress ? `<p>آدرس: ${h(clinicAddress)}</p>` : ''}
        <p>شماره تماس: ${toPersianDigits(clinicPhone)}${clinicPhone2 ? ` | ${toPersianDigits(clinicPhone2)}` : ''}${clinicPhone3 ? ` | ${toPersianDigits(clinicPhone3)}` : ''}</p>
      </div>
    </div></body></html>`)
    win!.document.close()
  }

  const fieldError = (field: string) => {
    const msg = errors[field]
    if (!msg) return null
    return <p className="text-xs text-rose-500 mt-1.5 pr-1 font-medium">{Array.isArray(msg) ? msg.join('، ') : msg}</p>
  }

  return (
    <div className="space-y-5">
      <PageHeader title="مدیریت نوبت‌ها">
        {hasPermission('appointment_create') && (
          <Button onClick={openNew} icon={Plus}>نوبت جدید</Button>
        )}
      </PageHeader>

      <div className="panel card-iranian">
        <div className="panel-body">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="text" className="input-field text-sm pr-9" placeholder="جستجوی نام یا کد ملی..." value={searchInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const v = e.target.value
                  setSearchInput(v)
                  if (searchTimer.current) clearTimeout(searchTimer.current)
                  searchTimer.current = setTimeout(() => setFilters((prev: any) => ({ ...prev, search: v })), 400)
                }} />
            </div>
            <select className="input-field text-sm" value={filters.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">همه وضعیت‌ها</option>
              <option value="scheduled">نوبت‌گذاری شده</option>
              <option value="completed">انجام شده</option>
              <option value="cancelled">لغو شده</option>
              <option value="rescheduled">تغییر یافته</option>
            </select>
            <select className="input-field text-sm" value={filters.doctor} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, doctor: e.target.value })}>
              <option value="">همه پزشکان</option>
              {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
            <JalaliDateInput value={filters.date_from} onChange={(v: string) => setFilters({ ...filters, date_from: v })} placeholder="از تاریخ" />
            <JalaliDateInput value={filters.date_to} onChange={(v: string) => setFilters({ ...filters, date_to: v })} placeholder="تا تاریخ" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="panel card-iranian"><SkeletonTable rows={6} cols={9} /></div>
      ) : groupedData.length === 0 ? (
        <EmptyState icon={CalendarIcon} title="نوبتی یافت نشد" description="نوبتی با فیلترهای فعلی وجود ندارد. برای ثبت نوبت جدید از دکمه بالا استفاده کنید." action={hasPermission('appointment_create') ? <Button onClick={openNew} icon={Plus}>نوبت جدید</Button> : undefined} />
      ) : (
        <>
        <div className="panel card-iranian overflow-hidden">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="text-center">بیمار</th>
                  <th className="text-center">کد ملی</th>
                  <th className="text-center">شماره پرونده</th>
                  <th className="text-center">شماره تماس</th>
                  <th className="text-center">نوبت‌ها</th>
                  <th className="text-center">انجام شده</th>
                  <th className="text-center">مانده</th>
                  <th className="text-center">بدهی</th>
                  <th className="text-center"></th>
                </tr>
              </thead>
              <tbody>
                {groupedData.flatMap((group: any) => {
                  const isOpen = expandedPatients[group.patient_id]
                  const totalBilled = (parseInt(group.total_billed) || 0)
                  const totalPaid = (parseInt(group.total_paid) || 0)
                  const balance = totalBilled - totalPaid
                  const totalApps = group.appointments.length
                  const completedApps = group.appointments.filter((a: any) => a.status === 'completed').length
                  const remainingApps = group.appointments.filter((a: any) => a.status === 'scheduled' || a.status === 'rescheduled').length
                  const rows: any[] = [
                    <tr key={group.patient_id} className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
                      onClick={() => setExpandedPatients((p: any) => ({ ...p, [group.patient_id]: !p[group.patient_id] }))}>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 whitespace-nowrap">{group.patient_name}</span>
                          {isOpen ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
                        </div>
                      </td>
                      <td className="text-center text-slate-600 text-sm whitespace-nowrap">{toPersianDigits(group.patient_national_id)}</td>
                      <td className="text-center text-slate-600 text-sm whitespace-nowrap">{group.patient_file_number ? smartPersianDigits(group.patient_file_number) : '—'}</td>
                      <td className="text-center text-slate-600 text-sm whitespace-nowrap ltr" dir="ltr">{toPersianDigits(group.patient_phone)}</td>
                      <td className="text-center font-bold text-slate-700">{toPersianDigits(totalApps)}</td>
                      <td className="text-center text-green-600 font-bold">{toPersianDigits(completedApps)}</td>
                      <td className="text-center text-amber-600 font-bold">{toPersianDigits(remainingApps)}</td>
                      <td className="text-center">
                        {balance > 0 ? <span className="text-red-500 font-bold">{formatMoney(balance)}</span> : <span className="text-green-600">تسویه</span>}
                      </td>
                      <td className="text-center">
                        <div className="flex justify-center gap-1">
                          {balance > 0 && (
                            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); setBalancePatient(group); setShowBalanceModal(true) }}
                              className="action-btn success" title="پرداخت مانده"><Wallet size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ]
                  if (isOpen) {
                    rows.push(
                      <tr key={"exp-" + group.patient_id} className="expanded-row">
                        <td colSpan={9} className="p-0 bg-slate-50/50">
                          <div className="border-t border-slate-100">
                            <div className="table-wrap">
                              <table className="inner-table">
                                <thead>
                                  <tr>
                                    <th className="text-center">پزشک / درمانگر</th>
                                    <th className="text-center">نوع درمان</th>
                                    <th className="text-center">تاریخ</th>
                                    <th className="text-center">ساعت</th>
                                    <th className="text-center">وضعیت</th>
                                    <th className="text-center">هزینه</th>
                                    <th className="text-center">شماره نوبت</th>
                                    <th className="text-center">عملیات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.appointments.map((a: any) => {
                                    const aptCost = (parseInt(a.cost) || 0) + (parseInt(a.service_cost) || 0)
                                    return (
                                      <tr key={a.id}>
                                        <td className="text-center">{a.doctor_name}</td>
                                        <td className="text-center">{a.treatment_name}</td>
                                        <td className="text-center">{toJalali(a.date)}</td>
                                        <td className="text-center">{a.time}</td>
                                        <td className="text-center">
                                          <StatusBadge status={a.status} label={
                                            a.status === 'scheduled' ? `نوبت ${toPersianDigits(a.daily_number || '')}` :
                                            a.status === 'completed' ? 'انجام شده' :
                                            a.status === 'cancelled' ? 'لغو شده' : 'تغییر یافته'
                                          } />
                                        </td>
                                        <td className="text-center font-bold">{aptCost ? formatMoney(aptCost) : '—'}</td>
                                        <td className="text-center font-bold text-slate-400">{toPersianDigits(a.daily_number || '')}</td>
                                        <td className="text-center">
                                          <div className="flex justify-center gap-1">
                                            {a.status === 'scheduled' && (
                                              <>
                                                <button onClick={() => setConfirmCancel(a.id)} className="action-btn danger" title="لغو"><Ban size={13} /></button>
                                                <button onClick={() => openEdit(a)} className="action-btn" title="ویرایش"><Calendar size={13} /></button>
                                              </>
                                            )}
                                                <button onClick={() => setConfirmDelete(a.id)} className="action-btn danger" title="حذف"><Trash2 size={13} /></button>
                                            <button onClick={() => printReceipt(a, clinicSettings)} className="action-btn" title="چاپ قبض"><Printer size={13} /></button>
                                            {a.status === 'scheduled' && (
                                              <button onClick={() => { setSmsAppointmentId(a.id); setShowSmsModal(true) }} className="action-btn" title="ارسال پیامک"><MessageSquare size={13} /></button>
                                            )}
                                            {a.status !== 'cancelled' && (
                                              <button onClick={() => openPaymentModal(a)} className="action-btn success" title="پرداخت"><Wallet size={13} /></button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100">
                              <div className="flex items-center gap-4 text-sm">
                                <span>صورتحساب: <strong>{formatMoney(totalBilled)}</strong> تومان</span>
                                <span className="text-green-600">پرداخت شده: <strong>{formatMoney(totalPaid)}</strong> تومان</span>
                                {balance > 0 ? (
                                  <span className="text-red-500 font-bold">مانده: <strong>{formatMoney(balance)}</strong> تومان</span>
                                ) : (
                                  <span className="text-green-600 font-bold">تسویه کامل</span>
                                )}
                              </div>
                              {balance > 0 && (
                                <Button size="sm" onClick={() => { setBalancePatient(group); setShowBalanceModal(true) }}>پرداخت مانده حساب</Button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  }
                  return rows
                })}
              </tbody>
            </table>
          </div>
        </div>
          {groupedData.length > 0 && (
            <div className="text-xs text-slate-400 px-1">جمع کل: {toPersianDigits(totalCount)} نوبت برای {toPersianDigits(groupedData.length)} بیمار</div>
          )}
      </> )}


      <Modal open={showModal} onClose={() => setShowModal(false)} size="md" title={editing ? 'ویرایش نوبت' : 'نوبت جدید'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">بیمار</label>
            <PatientSearchSelect
              value={searchTerm}
              onSelect={(p: any) => { setForm({ ...form, patient: p.id }); setSearchTerm(`${p.first_name} ${p.last_name}`) }}
              minChars={1}
            />
            {fieldError('patient')}
          </div>
          <div>
            <label className="label">پزشک / درمانگر</label>
            <select className="input-field" value={form.doctor} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, doctor: e.target.value })} required>
              <option value="">انتخاب پزشک / درمانگر</option>
              {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
            {fieldError('doctor')}
          </div>
          <div>
            <label className="label">نوع درمان</label>
            <select className="input-field" value={form.treatment_type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, treatment_type: e.target.value })} required>
              <option value="">انتخاب نوع درمان</option>
              {treatments.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {fieldError('treatment_type')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">تاریخ</label>
              <JalaliDateInput value={form.date} onChange={(v: string) => setForm({ ...form, date: v })} required />
              {fieldError('date')}
            </div>
            <div>
              <label className="label">ساعت</label>
              <input type="text" className="input-field text-center" placeholder="۱۴:۳۰" value={form.time} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                let v = toEnglishDigits(e.target.value).replace(/[^0-9:]/g, '').slice(0, 5)
                if (v.length === 2 && /^\d{2}$/.test(v)) v += ':'
                setForm({ ...form, time: v })
              }} onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                const parts = toEnglishDigits(e.target.value).split(':')
                if (parts.length === 2) {
                  let h = Math.min(23, Math.max(0, parseInt(parts[0]) || 0))
                  let m = Math.min(59, Math.max(0, parseInt(parts[1]) || 0))
                  setForm({ ...form, time: String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') })
                }
              }} required />
              {fieldError('time')}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">هزینه نوبت (تومان)</label>
              <input type="text" className="input-field" placeholder="مثال: ۳۰۰/۰۰۰" value={form.cost ? formatMoney(form.cost) : ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, cost: toEnglishDigits(e.target.value).replace(/[^0-9]/g, '') })} />
              {fieldError('cost')}
            </div>
            <div>
              <label className="label">هزینه خدمات (تومان)</label>
              <input type="text" className="input-field" placeholder="مثال: ۲۰۰/۰۰۰" value={form.service_cost ? formatMoney(form.service_cost) : ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, service_cost: toEnglishDigits(e.target.value).replace(/[^0-9]/g, '') })} />
              {fieldError('service_cost')}
            </div>
          </div>
          <div>
            <label className="label">یادداشت</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {errors.non_field_errors && (
            <div className="bg-rose-50 text-rose-600 text-xs font-medium px-4 py-2.5 rounded-xl border border-rose-200">
              {Array.isArray(errors.non_field_errors) ? errors.non_field_errors.join('، ') : errors.non_field_errors}
            </div>
          )}
          <Button type="submit" variant="gradient" className="w-full">{editing ? 'ذخیره تغییرات' : 'ثبت نوبت'}</Button>
        </form>
      </Modal>

      <PaymentModal
        open={!!(showPaymentModal && paymentApp)}
        onClose={() => { setShowPaymentModal(false); setPaymentApp(null) }}
        appointment={paymentApp}
        onSuccess={load}
      />

      <PaymentModal
        open={!!(showBalanceModal && balancePatient)}
        onClose={() => { setShowBalanceModal(false); setBalancePatient(null) }}
        balancePatient={balancePatient}
        onSuccess={load}
      />

      <SmsSendModal
        show={showSmsModal}
        onClose={() => { setShowSmsModal(false); setSmsAppointmentId(null) }}
        type="confirm"
        appointmentId={smsAppointmentId}
        onSuccess={load}
      />

      <ConfirmDialog
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => handleCancel(confirmCancel)}
        title="لغو نوبت"
        message="آیا از لغو این نوبت اطمینان دارید؟"
        confirmLabel="لغو نوبت"
        variant="warning"
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="حذف نوبت"
        message="آیا از حذف کامل این نوبت اطمینان دارید؟ این عملیات قابل بازگشت نیست"
        confirmLabel="حذف شود"
        variant="danger"
      />
    </div>
  )
}
