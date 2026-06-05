import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowRight, Phone, Calendar as CalIcon, MapPin, FileText, Activity, DollarSign, Printer, Image, Edit2, CheckCircle, XCircle } from 'lucide-react'
import { getPatient, updatePatient, getAppointments, getMedicalRecords, getBillings, getClinicSettings } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toJalali, toPersianDigits, formatMoney, formatAge, escapeHtml } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'
import FilePreviewModal from '../components/FilePreviewModal'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'

const CLINIC_NAME = 'مطب تخصصی دکتر محمد طاهری'

function getPrescriptionNumber(r: any) {
  return r.id ? `نسخه ${toPersianDigits(r.id)}` : ''
}

function generatePrescriptionHTML(r: any, user: any, clinicSettings: any) {
  const h = (s: any) => escapeHtml(s)
  const clinicPhone = (clinicSettings?.phone || '').replace(/-/g, '')
  const clinicPhone2 = (clinicSettings?.phone2 || '').replace(/-/g, '')
  const clinicAddress = clinicSettings?.address || ''
  const signatureImg = user?.signature ? `<img src="${h(user.signature)}" alt="امضای پزشک" style="height:45px;width:auto;" />` : ''
  const today = toJalali(new Date().toISOString().split('T')[0])
  const fileCount = r.files?.length || 0
  return `<html dir="rtl"><head><title>نسخه پزشک</title>
  <style>
    @page { margin: 0; size: A5; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @font-face {
      font-family: 'Vazirmatn'; font-weight: 500;
      src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Vazirmatn'; font-weight: 700;
      src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2');
    }
    body {
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      background: #f0f2f5; padding: 20px; font-size: 10px; color: #1e293b;
    }
    .paper {
      width: 148mm; min-height: 200mm; margin: 0 auto;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      padding: 10mm 8mm; position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    .paper::before {
      content: ''; position: absolute; top: 0; right: 0; left: 0;
      height: 5px;
      background: linear-gradient(90deg, #0d9488, #14b8a6, #0d9488);
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; margin-bottom: 12px; }
    .header-right { text-align: right; }
    .header-right h1 { font-size: 16px; color: #0f766e; font-weight: 700; letter-spacing: 1px; }
    .header-right .sub { font-size: 10px; color: #64748b; }
    .header-left { text-align: left; font-size: 9px; color: #64748b; line-height: 1.8; }
    .header-left .hlbl { color: #94a3b8; }
    .header-left .hval { color: #1e293b; font-weight: 700; margin-right: 2px; }
    .doctor-box { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; padding: 8px 12px; background: linear-gradient(135deg, #f0fdfa, #f8fafc); border-right: 4px solid #0d9488; border-radius: 4px; }
    .doctor-box .doc-name { font-size: 15px; font-weight: 700; color: #0f766e; }
    .doctor-box .doc-spec { font-size: 10px; color: #64748b; }
    .doctor-box .doc-council { font-size: 9px; color: #94a3b8; margin-right: 8px; }
    .patient-line { display: flex; gap: 16px; font-size: 10px; margin-bottom: 12px; padding: 6px 0; }
    .patient-line .plbl { color: #94a3b8; }
    .patient-line .pval { color: #1e293b; font-weight: 700; }
    .rx-box { border: 2px solid #0d9488; border-radius: 8px; padding: 14px; margin-bottom: 14px; background: #fdfefe; position: relative; }
    .rx-title { position: absolute; top: -10px; right: 16px; background: #0d9488; color: #fff; font-size: 9px; padding: 2px 14px; border-radius: 20px; font-weight: 700; }
    .rx-item { padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 11px; line-height: 1.8; }
    .rx-item:last-child { border-bottom: none; }
    .rx-item::before { content: '●'; color: #0d9488; margin-left: 6px; font-size: 7px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px; border-top: 1px solid #e2e8f0; margin-top: 14px; }
    .footer-right { text-align: right; font-size: 9px; color: #64748b; line-height: 1.8; max-width: 60%; }
    .footer-right .flbl { color: #94a3b8; }
    .signature-area { text-align: center; min-width: 110px; }
    .signature-area .sig-img { min-height: 40px; display: flex; align-items: center; justify-content: center; }
    .signature-area .sig-line { border-top: 1px solid #cbd5e1; width: 110px; margin: 4px auto 0; padding-top: 4px; font-size: 9px; color: #64748b; }
  </style></head><body>
  <div class="paper">
    <div class="header">
      <div class="header-right">
        <h1>${h(CLINIC_NAME)}</h1>
        <div class="sub">${h(user?.specialization || '')}</div>
      </div>
      <div class="header-left">
        <div><span class="hlbl">تاریخ:</span><span class="hval">${toJalali(r.date) || today}</span></div>
        <div><span class="hlbl">شماره:</span><span class="hval">${getPrescriptionNumber(r)}</span></div>
        ${fileCount > 0 ? `<div><span class="hlbl">پیوست:</span><span class="hval">${toPersianDigits(fileCount)} فایل</span></div>` : ''}
      </div>
    </div>
    <div class="doctor-box">
      <span class="doc-name">${h(r.doctor_name || user?.first_name + ' ' + user?.last_name)}</span>
      <span class="doc-spec">${h(user?.specialization || '')}</span>
      ${user?.medical_council_number ? `<span class="doc-council">شماره نظام پزشکی: ${toPersianDigits(user.medical_council_number)}</span>` : ''}
    </div>
    <div class="patient-line">
      <div><span class="plbl">بیمار:</span><span class="pval">${h(r.patient_name)}</span></div>
      <div><span class="plbl">جلسه:</span><span class="pval">${toPersianDigits(r.session_number)}</span></div>
    </div>
    <div class="rx-box">
      <div class="rx-title">نسخه</div>
      ${r.prescription ? r.prescription.split('\n').map((line: string) => `<div class="rx-item">${h(line)}</div>`).join('') : '<div class="rx-item" style="color:#94a3b8;">نسخه ثبت نشده</div>'}
    </div>
    <div class="footer">
      <div class="footer-right">
        ${clinicAddress ? `<div><span class="flbl">آدرس:</span> ${clinicAddress}</div>` : ''}
        <div><span class="flbl">تلفن:</span> ${toPersianDigits(clinicPhone)}${clinicPhone2 ? ` | ${toPersianDigits(clinicPhone2)}` : ''}</div>
      </div>
      <div class="signature-area">
        <div class="sig-img">${signatureImg || '<span style="color:#cbd5e1;font-size:10px;">—</span>'}</div>
        <div class="sig-line">امضای پزشک</div>
      </div>
    </div>
  </div></body></html>`
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasRole, hasPermission } = useAuth()
  const [patient, setPatient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [billings, setBillings] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string>('info')
  const [editing, setEditing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [birthDate, setBirthDate] = useState<string>('')
  const [filePreview, setFilePreview] = useState<any>(null)
  const [clinicSettings, setClinicSettings] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const birthInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getClinicSettings().then(({ data }: any) => {
      setClinicSettings(Array.isArray(data) ? data[0] : data)
    }).catch(() => {})
    const patientId = Number(id)
    Promise.all([
      getPatient(patientId),
      getAppointments({ patient: patientId }),
      getMedicalRecords({ patient: patientId }),
      getBillings({ patient: patientId }),
    ]).then(([p, a, r, b]: any[]) => {
      setPatient(p.data)
      setBirthDate(p.data.birth_date || '')
      setAppointments(Array.isArray(a.data) ? a.data : a.data.results || [])
      setRecords(Array.isArray(r.data) ? r.data : r.data.results || [])
      setBillings(Array.isArray(b.data) ? b.data : b.data.results || [])
    }).catch(() => toast.error('متأسفانه در دریافت اطلاعات بیمار خطایی رخ داد', { icon: <XCircle size={20} /> }))
      .finally(() => setLoading(false))
  }, [id])

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    const f = e.target as any
    try {
      await updatePatient(Number(id), {
        first_name: f.first_name.value,
        last_name: f.last_name.value,
        father_name: f.father_name.value,
        national_id: f.national_id.value,
        old_file_number: f.old_file_number.value,
        education: f.education.value,
        job: f.job.value,
        phone: f.phone.value,
        emergency_phone: f.emergency_phone.value,
        birth_date: f.birth_date.value || null,
        address: f.address.value,
      })
      toast.success('اطلاعات بیمار با موفقیت به‌روز شد', { icon: <CheckCircle size={20} /> })
      setEditing(false)
      const { data } = await getPatient(Number(id))
      setPatient(data)
    } catch (err: any) {
      toast.error('متأسفانه در ویرایش اطلاعات بیمار خطایی رخ داد', { icon: <XCircle size={20} /> })
    }
  }

  const handlePrint = () => {
    const h = (s: any) => escapeHtml(s)
    const p = patient
    const win = window.open('', '', 'width=900,height=650')
    const statusMap: Record<string, string> = {
      completed: 'انجام شده', cancelled: 'لغو شده', scheduled: 'نوبت‌گذاری شده', rescheduled: 'تغییر یافته',
    }
    const paymentMap: Record<string, string> = { cash: 'نقدی', card: 'کارت', insurance: 'بیمه', card_to_card: 'کارت به کارت' }
    const billingStatusMap: Record<string, string> = { paid: 'پرداخت شده', partial: 'پرداخت جزئی', unpaid: 'پرداخت نشده' }

    win!.document.write(`<html dir="rtl"><head><title>پرونده ${h(p.first_name)} ${h(p.last_name)}</title>
    <style>
      @page { margin: 0.8cm; size: A4 landscape; }
      @font-face { font-family: 'Vazirmatn'; font-weight: 300; src: url('/fonts/webfonts/Vazirmatn-Light.woff2') format('woff2'); }
      @font-face { font-family: 'Vazirmatn'; font-weight: 400; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); }
      @font-face { font-family: 'Vazirmatn'; font-weight: 700; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); }
      @font-face { font-family: 'Vazirmatn'; font-weight: 900; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
        font-size: 10px; color: #1e293b; line-height: 1.8; padding: 12px;
        border: 2px solid #000;
      }
      .brand { position: relative; text-align: center; padding-bottom: 10px; margin-bottom: 14px; }
      .brand::after { content: ''; position: absolute; bottom: 0; right: 25%; left: 25%; height: 1px; background: #94a3b8; }
      .brand h1 { font-size: 18px; font-weight: 900; color: #000; letter-spacing: 1px; }
      .brand .sub { font-size: 10px; color: #334155; font-weight: 500; margin-top: 2px; }
      .brand .spec { font-size: 9px; color: #475569; }
      .title-bar {
        background: #000; color: #fff; padding: 6px 16px; font-size: 10px; font-weight: 700;
        margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;
      }
      .title-bar .badge { background: rgba(255,255,255,0.15); padding: 2px 10px; border-radius: 12px; font-size: 9px; font-weight: 400; }
      .section { margin-bottom: 16px; }
      .section-title {
        font-size: 11px; font-weight: 700; color: #000;
        border-bottom: 2px solid #000; padding-bottom: 3px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;
      }
      .section-title .num { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; background: #000; color: #fff; border-radius: 50%; font-size: 8px; font-weight: 700; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; }
      .info-item { padding: 3px 6px; border-bottom: 1px solid #d1d5db; font-size: 9px; }
      .info-item .label { color: #475569; font-weight: 500; }
      .info-item .value { color: #000; font-weight: 700; margin-right: 3px; }
      .info-item.full { grid-column: 1 / -1; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 6px; border: 1px solid #000; }
      th { background: #e5e7eb; color: #000; font-weight: 700; padding: 4px 6px; text-align: right; font-size: 8px; border: 1px solid #000; }
      td { padding: 3px 6px; text-align: right; font-size: 9px; border: 1px solid #d1d5db; color: #1e293b; }
      .record-card { border-bottom: 1px solid #d1d5db; padding: 5px 0; margin-bottom: 3px; }
      .record-card:last-child { border-bottom: none; margin-bottom: 0; }
      .record-card .rc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
      .record-card .rc-header .rc-title { font-weight: 700; font-size: 10px; color: #000; }
      .record-card .rc-header .rc-meta { font-size: 8px; color: #475569; }
      .record-card .rc-field { font-size: 9px; color: #1e293b; padding: 1px 0; }
      .record-card .rc-field .rcl { color: #475569; font-weight: 600; }
      .empty-state { color: #9ca3af; font-size: 9px; padding: 6px 0; text-align: center; }
      .footer { margin-top: 16px; padding-top: 6px; border-top: 1px solid #000; text-align: center; font-size: 8px; color: #475569; }
    </style></head><body>
    <div class="brand">
      <h1>${h('مطب تخصصی دکتر محمد طاهری')}</h1>
      <div class="sub">${h('کلینیک تخصصی مغز و اعصاب و روان')}</div>
      <div class="spec">${h('متخصص اعصاب و روان')} — ${h('شماره نظام پزشکی: ۵۲۳۴۱')}</div>
    </div>
    <div class="title-bar">
      <span>${h('پرونده پزشکی')}</span>
      <span class="badge">${h(p.first_name)} ${h(p.last_name)} — ${toPersianDigits(p.national_id)}</span>
    </div>

    <div class="section">
      <div class="section-title"><span class="num">۱</span> ${h('اطلاعات فردی')}</div>
      <div class="info-grid">
        <div class="info-item"><span class="label">${h('نام:')}</span><span class="value">${h(p.first_name)}</span></div>
        <div class="info-item"><span class="label">${h('نام خانوادگی:')}</span><span class="value">${h(p.last_name)}</span></div>
        <div class="info-item"><span class="label">${h('نام پدر:')}</span><span class="value">${h(p.father_name) || '—'}</span></div>
        <div class="info-item"><span class="label">${h('کد ملی:')}</span><span class="value">${toPersianDigits(p.national_id)}</span></div>
        <div class="info-item"><span class="label">${h('تاریخ تولد:')}</span><span class="value">${toJalali(p.birth_date) || '—'}</span></div>
        <div class="info-item"><span class="label">${h('شماره تماس:')}</span><span class="value">${toPersianDigits(p.phone) || '—'}</span></div>
        <div class="info-item"><span class="label">${h('تلفن اضطراری:')}</span><span class="value">${toPersianDigits(p.emergency_phone) || '—'}</span></div>
        <div class="info-item"><span class="label">${h('اولین مراجعه:')}</span><span class="value">${p.first_visit_date ? toJalali(p.first_visit_date) : '—'}</span></div>
        <div class="info-item"><span class="label">${h('تاریخ ثبت:')}</span><span class="value">${toJalali(p.created_at)}</span></div>
        <div class="info-item full"><span class="label">${h('آدرس:')}</span><span class="value">${h(p.address) || '—'}</span></div>
        <div class="info-item full"><span class="label">${h('تاریخچه پزشکی:')}</span><span class="value">${h(p.medical_history) || '—'}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title"><span class="num">۲</span> ${h('پرونده پزشکی')} (${toPersianDigits(records.length)} ${h('جلسه')})</div>
      ${records.length > 0 ? records.map((r: any) => `
      <div class="record-card">
        <div class="rc-header">
          <span class="rc-title">${h('جلسه')} ${toPersianDigits(r.session_number)} — ${toJalali(r.date)}</span>
          <span class="rc-meta">${h(r.doctor_name || '')}</span>
        </div>
        ${r.diagnosis ? `<div class="rc-field"><span class="rcl">${h('تشخیص:')}</span> ${h(r.diagnosis)}</div>` : ''}
        ${r.treatment_plan ? `<div class="rc-field"><span class="rcl">${h('طرح درمان:')}</span> ${h(r.treatment_plan)}</div>` : ''}
        ${r.notes ? `<div class="rc-field"><span class="rcl">${h('یادداشت:')}</span> ${h(r.notes)}</div>` : ''}
        ${r.prescription ? `<div class="rc-field"><span class="rcl">${h('نسخه:')}</span> ${h(r.prescription)}</div>` : ''}
      </div>`).join('') : `<div class="empty-state">${h('جلسه درمانی ثبت نشده')}</div>`}
    </div>

    <div class="section">
      <div class="section-title"><span class="num">۳</span> ${h('نوبت‌ها')} (${toPersianDigits(appointments.length)} ${h('نوبت')})</div>
      ${appointments.length > 0 ? `
      <table><thead><tr><th>${h('ردیف')}</th><th>${h('تاریخ')}</th><th>${h('ساعت')}</th><th>${h('نوع درمان')}</th><th>${h('وضعیت')}</th></tr></thead><tbody>
        ${appointments.map((a: any, i: number) => `<tr>
          <td style="text-align:center">${toPersianDigits(i + 1)}</td>
          <td>${toJalali(a.date)}</td>
          <td style="text-align:center">${toPersianDigits(a.time)}</td>
          <td>${h(a.treatment_name) || '—'}</td>
          <td style="text-align:center">${statusMap[a.status] || h(a.status)}</td>
        </tr>`).join('')}
      </tbody></table>` : `<div class="empty-state">${h('نوبتی ثبت نشده')}</div>`}
    </div>

    <div class="section">
      <div class="section-title"><span class="num">۴</span> ${h('صورتحساب‌ها')} (${toPersianDigits(billings.length)} ${h('فقره')})</div>
      ${billings.length > 0 ? `
      <table><thead><tr><th>${h('ردیف')}</th><th>${h('تاریخ')}</th><th>${h('مبلغ کل')}</th><th>${h('پرداختی')}</th><th>${h('روش پرداخت')}</th><th>${h('وضعیت')}</th></tr></thead><tbody>
        ${billings.map((b: any, i: number) => `<tr>
          <td style="text-align:center">${toPersianDigits(i + 1)}</td>
          <td>${toJalali(b.created_at)}</td>
          <td>${formatMoney(b.total_amount)}</td>
          <td>${formatMoney(b.paid_amount)}</td>
          <td style="text-align:center">${paymentMap[b.payment_method] || '—'}</td>
          <td style="text-align:center">${billingStatusMap[b.status] || h(b.status)}</td>
        </tr>`).join('')}
      </tbody></table>` : `<div class="empty-state">${h('صورتحسابی ثبت نشده')}</div>`}
    </div>

    <div class="footer">${h('این برگه به صورت الکترونیکی صادر شده و نیازی به امضا و مهر ندارد')}</div>
    </body></html>`)
    win!.document.close()
    win!.print()
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" /></div>
  if (!patient) return <div className="text-center py-20 text-gray-500">بیمار یافت نشد</div>

  const allTabs = [
    { id: 'info', label: 'اطلاعات فردی', permission: 'patient_info' },
    { id: 'appointments', label: 'نوبت‌ها', permission: 'patient_appointments' },
    { id: 'records', label: 'پرونده پزشکی', permission: 'patient_records' },
    { id: 'billing', label: 'صورتحساب', permission: 'patient_billing' },
  ]
  const tabs = allTabs.filter(t => hasPermission(t.permission))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/patients')} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
          <ArrowRight size={18} /> بازگشت
        </button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" icon={Printer}>چاپ پرونده</Button>
          {hasPermission('patient_edit') && (
            <Button onClick={() => setEditing(!editing)} variant={editing ? 'secondary' : 'gradient'} icon={editing ? undefined : Edit2}>
              {editing ? 'لغو ویرایش' : 'ویرایش اطلاعات'}
            </Button>
          )}
        </div>
      </div>

      <div ref={printRef}>
        {editing ? (
          <div className="card p-6">
            <h2 className="text-lg font-bold mb-5 text-surface-800">ویرایش اطلاعات بیمار</h2>
            <form onSubmit={handleEdit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="label">نام <span className="text-rose-500">*</span></label><input name="first_name" defaultValue={patient.first_name} className="input-field" required /></div>
              <div><label className="label">نام خانوادگی <span className="text-rose-500">*</span></label><input name="last_name" defaultValue={patient.last_name} className="input-field" required /></div>
              <div><label className="label">نام پدر</label><input name="father_name" defaultValue={patient.father_name || ''} className="input-field" /></div>
              <div><label className="label">کد ملی <span className="text-rose-500">*</span></label><input name="national_id" defaultValue={patient.national_id} className="input-field" required /></div>
              <div><label className="label">شماره پرونده قدیمی</label><input name="old_file_number" defaultValue={patient.old_file_number || ''} className="input-field" placeholder="برای بیماران قدیمی" /></div>
              <div><label className="label">تحصیلات</label>
                <select name="education" defaultValue={patient.education || ''} className="input-field">
                  <option value="">انتخاب کنید</option>
                  <option value="ciclu">سیکل</option>
                  <option value="diplom">دیپلم</option>
                  <option value="super_diplom">فوق دیپلم</option>
                  <option value="licence">لیسانس</option>
                  <option value="master">فوق لیسانس</option>
                  <option value="doctora">دکترا</option>
                </select>
              </div>
              <div><label className="label">شغل</label><input name="job" defaultValue={patient.job || ''} className="input-field" /></div>
              <div><label className="label">تلفن همراه <span className="text-rose-500">*</span></label><input name="phone" className="input-field" type="tel" defaultValue={patient.phone} required placeholder="۰۹۱۲۳۴۵۶۷۸۹" /></div>
              <div><label className="label">تاریخ تولد</label>
                <input ref={birthInputRef} name="birth_date" type="hidden" defaultValue={patient.birth_date || ''} />
                <JalaliDateInput value={birthDate} onChange={v => { setBirthDate(v); if (birthInputRef.current) birthInputRef.current.value = v }} />
              </div>
              <div><label className="label">تلفن اضطراری</label><input name="emergency_phone" className="input-field" type="tel" defaultValue={patient.emergency_phone} placeholder="۰۹۱۲۳۴۵۶۷۸۹" /></div>
              {patient.first_visit_date && (
                <div><label className="label">اولین مراجعه</label><input className="input-field text-surface-400" value={toJalali(patient.first_visit_date)} readOnly /></div>
              )}
              <div className="md:col-span-2"><label className="label">آدرس</label><textarea name="address" defaultValue={patient.address} className="input-field" rows={2} /></div>
              <div className="md:col-span-2"><Button type="submit" variant="gradient" className="w-full" icon={FileText}>ذخیره تغییرات</Button></div>
            </form>
          </div>
        ) : (
          <>
            <div className="card p-5">
              <div className="flex items-center gap-4 mb-5 pb-4 border-b border-surface-100">
                <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-brand-600">{patient.first_name?.[0]}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-surface-800 truncate">{patient.first_name} {patient.last_name}</h2>
                  <p className="text-sm text-surface-400">کد ملی: {toPersianDigits(patient.national_id)}</p>
                  {patient.file_number && <p className="text-sm text-brand-500 font-bold">شماره پرونده: {toPersianDigits(patient.file_number)}{patient.old_file_number ? <span className="text-surface-400 font-normal mr-3">قدیمی: {toPersianDigits(patient.old_file_number)}</span> : ''}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                <div className="flex items-center gap-2"><Phone size={15} className="text-surface-400 shrink-0" /><span className="truncate">{toPersianDigits(patient.phone)}</span></div>
                <div className="flex items-center gap-2"><CalIcon size={15} className="text-surface-400 shrink-0" /><span className="truncate">{toJalali(patient.birth_date) || '—'}{patient.age ? <span className="text-brand-600 font-bold mr-1">({formatAge(patient.age)})</span> : ''}</span></div>
                <div className="flex items-center gap-2"><MapPin size={15} className="text-surface-400 shrink-0" /><span className="truncate">{patient.address || '—'}</span></div>
                {patient.father_name && <div className="flex items-center gap-2"><span className="text-surface-400 font-medium shrink-0">نام پدر:</span> <span className="truncate">{patient.father_name}</span></div>}
                {patient.emergency_phone && <div className="flex items-center gap-2"><span className="text-surface-400 font-medium shrink-0">تلفن اضطراری:</span> <span className="truncate">{toPersianDigits(patient.emergency_phone)}</span></div>}
                {patient.first_visit_date && <div className="flex items-center gap-2"><span className="text-surface-400 font-medium shrink-0">اولین مراجعه:</span> <span className="truncate">{toJalali(patient.first_visit_date)}</span></div>}
                {patient.education && <div className="flex items-center gap-2"><span className="text-surface-400 font-medium shrink-0">تحصیلات:</span> <span className="truncate">{
                  {ciclu: 'سیکل', diplom: 'دیپلم', super_diplom: 'فوق دیپلم', licence: 'لیسانس', master: 'فوق لیسانس', doctora: 'دکترا'}[patient.education] || patient.education
                }</span></div>}
                {patient.job && <div className="flex items-center gap-2"><span className="text-surface-400 font-medium shrink-0">شغل:</span> <span className="truncate">{patient.job}</span></div>}
                {patient.old_file_number && <div className="flex items-center gap-2"><span className="text-surface-400 font-medium shrink-0">شماره پرونده قدیمی:</span> <span className="truncate">{toPersianDigits(patient.old_file_number)}</span></div>}
                {patient.medical_history && <div className="md:col-span-3 flex items-start gap-2 pt-2 border-t border-surface-50"><FileText size={15} className="text-surface-400 mt-0.5 shrink-0" /><span className="text-surface-700">{patient.medical_history}</span></div>}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex border-b border-surface-100 mb-5 -mx-5 px-5 overflow-x-auto">
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${activeTab === t.id ? 'border-brand-500 text-brand-500' : 'border-transparent text-surface-400 hover:text-surface-600'}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'appointments' && (
                <div className="-mx-5 -mb-5">
                  <div className="table-wrap">
                    <table>
                      <thead><tr>
                        <th className="text-center">تاریخ</th>
                        <th className="text-center">ساعت</th>
                        <th className="text-center">نوع درمان</th>
                        <th className="text-center">پزشک</th>
                        <th className="text-center">وضعیت</th>
                      </tr></thead>
                      <tbody>
                        {appointments.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-10 text-surface-400">نوبتی ثبت نشده</td></tr>
                        ) : appointments.map(a => (
                          <tr key={a.id}>
                            <td className="text-center">{toJalali(a.date)}</td>
                            <td className="text-center">{toPersianDigits(a.time)}</td>
                            <td className="text-center">{a.treatment_name}</td>
                            <td className="text-center">{a.doctor_name}</td>
                            <td className="text-center">
                              <StatusBadge status={a.status} label={
                                a.status === 'completed' ? 'انجام شده' : a.status === 'cancelled' ? 'لغو شده' : a.status === 'rescheduled' ? 'تغییر یافته' : 'نوبت‌گذاری شده'
                              } />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'records' && (
                <div className="space-y-3">
                  {records.length === 0 ? (
                    <p className="text-center py-10 text-surface-400">پرونده پزشکی ثبت نشده</p>
                  ) : records.map(r => (
                    <div key={r.id} className="border border-surface-100 rounded-2xl p-4 bg-surface-50/30">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-surface-100">
                        <span className="font-bold text-surface-700">جلسه {toPersianDigits(r.session_number)} - {toJalali(r.date)}</span>
                        <span className="text-sm text-surface-400">{r.doctor_name}</span>
                      </div>
                      {r.diagnosis && <p className="text-sm mb-2"><span className="font-semibold text-surface-600">تشخیص:</span> <span className="text-surface-700">{r.diagnosis}</span></p>}
                      {r.treatment_plan && <p className="text-sm mb-2"><span className="font-semibold text-surface-600">طرح درمان:</span> <span className="text-surface-700">{r.treatment_plan}</span></p>}
                      {r.notes && <p className="text-sm mb-2"><span className="font-semibold text-surface-600">یادداشت:</span> <span className="text-surface-700">{r.notes}</span></p>}
                      {r.prescription && (
                        <div className="flex items-start gap-2">
                          <p className="text-sm flex-1"><span className="font-semibold text-surface-600">نسخه:</span> <span className="text-surface-700">{r.prescription}</span></p>
                          <button onClick={() => {
                            const win = window.open('', '', 'width=600,height=800')
                            win!.document.write(generatePrescriptionHTML(r, user, clinicSettings))
                            win!.document.close()
                          }} className="action-btn shrink-0 mt-0.5" title="چاپ نسخه"><Printer size={14} /></button>
                        </div>
                      )}
                      {r.files?.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {r.files.map((f: any, i: number) => {
                            const isImg = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f.file)
                            return (
                              <button key={f.id} onClick={() => setFilePreview({ files: r.files, index: i })}
                                className="text-xs bg-surface-100 text-surface-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-brand-50 hover:text-brand-600 transition-all">
                                {isImg ? <Image size={12} /> : <FileText size={12} />} {f.description || 'فایل'}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'billing' && (
                <div>
                  {billings.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {(() => {
                        const totalBilled = billings.reduce((s, b) => s + parseInt(b.total_amount || 0), 0)
                        const totalPaid = billings.reduce((s, b) => s + parseInt(b.paid_amount || 0), 0)
                        const balance = totalBilled - totalPaid
                        return <>
                          <div className="stat-card justify-center text-center p-4">
                            <div>
                              <div className="text-xs text-brand-500 font-medium mb-1">جمع صورت‌حساب</div>
                              <div className="text-lg font-extrabold text-surface-800">{formatMoney(totalBilled)}</div>
                              <div className="text-[10px] text-surface-400">تومان</div>
                            </div>
                          </div>
                          <div className="stat-card justify-center text-center p-4">
                            <div>
                              <div className="text-xs text-success-500 font-medium mb-1">پرداخت شده</div>
                              <div className="text-lg font-extrabold text-surface-800">{formatMoney(totalPaid)}</div>
                              <div className="text-[10px] text-surface-400">تومان</div>
                            </div>
                          </div>
                          <div className={`stat-card justify-center text-center p-4 ${balance > 0 ? 'border-rose-200' : 'border-success-200'}`}>
                            <div>
                              <div className={`text-xs font-medium mb-1 ${balance > 0 ? 'text-rose-500' : 'text-success-500'}`}>مانده حساب</div>
                              <div className={`text-lg font-extrabold ${balance > 0 ? 'text-rose-700' : 'text-success-700'}`}>{balance > 0 ? formatMoney(balance) : 'تسویه'}</div>
                              <div className={`text-[10px] ${balance > 0 ? 'text-rose-400' : 'text-success-400'}`}>{balance > 0 ? 'تومان' : 'کامل'}</div>
                            </div>
                          </div>
                        </>
                      })()}
                    </div>
                  )}
                  <div className="-mx-5 -mb-5">
                    <div className="table-wrap">
                      <table>
                        <thead><tr>
                          <th className="text-center">تاریخ</th>
                          <th className="text-center">نوع</th>
                          <th className="text-center">مبلغ کل</th>
                          <th className="text-center">پرداختی</th>
                          <th className="text-center">روش پرداخت</th>
                          <th className="text-center">وضعیت</th>
                        </tr></thead>
                        <tbody>
                          {billings.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-10 text-surface-400">صورتحسابی ثبت نشده</td></tr>
                          ) : billings.map(b => (
                            <tr key={b.id}>
                              <td className="text-center">{toJalali(b.created_at)}</td>
                              <td className="text-center">{b.cost_type === 'visit' ? 'ویزیت' : b.cost_type === 'service' ? 'خدمات' : '—'}</td>
                              <td className="text-center font-bold">{formatMoney(b.total_amount)}</td>
                              <td className="text-center">{formatMoney(b.paid_amount)}</td>
                              <td className="text-center">
                                {b.payment_method === 'cash' ? 'نقدی' : b.payment_method === 'card' ? 'کارت' : b.payment_method === 'insurance' ? 'بیمه' : 'کارت به کارت'}
                              </td>
                              <td className="text-center"><StatusBadge status={b.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'info' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div className="flex items-center gap-2"><span className="text-surface-400 font-medium min-w-[90px]">شماره پرونده:</span><span className="font-semibold text-surface-700">{patient.file_number ? toPersianDigits(patient.file_number) : '—'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-surface-400 font-medium min-w-[90px]">پرونده قدیمی:</span><span className="font-semibold text-surface-700">{patient.old_file_number ? toPersianDigits(patient.old_file_number) : '—'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-surface-400 font-medium min-w-[90px]">تاریخ ثبت:</span><span className="font-semibold text-surface-700">{toJalali(patient.created_at)}</span></div>
                    <div className="flex items-center gap-2"><span className="text-surface-400 font-medium min-w-[90px]">نام پدر:</span><span className="font-semibold text-surface-700">{patient.father_name || '—'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-surface-400 font-medium min-w-[90px]">تحصیلات:</span><span className="font-semibold text-surface-700">{{
                      ciclu: 'سیکل', diplom: 'دیپلم', super_diplom: 'فوق دیپلم',
                      licence: 'لیسانس', master: 'فوق لیسانس', doctora: 'دکترا'
                    }[patient.education] || '—'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-surface-400 font-medium min-w-[90px]">شغل:</span><span className="font-semibold text-surface-700">{patient.job || '—'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-surface-400 font-medium min-w-[90px]">سن:</span><span className="font-semibold text-surface-700">{patient.age ? formatAge(patient.age) : '—'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-surface-400 font-medium min-w-[90px]">اولین مراجعه:</span><span className="font-semibold text-surface-700">{patient.first_visit_date ? toJalali(patient.first_visit_date) : '—'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-surface-400 font-medium min-w-[90px]">تعداد نوبت‌ها:</span><span className="font-semibold text-surface-700">{toPersianDigits(appointments.length)}</span></div>
                    <div className="flex items-center gap-2"><span className="text-surface-400 font-medium min-w-[90px]">جلسات درمانی:</span><span className="font-semibold text-surface-700">{toPersianDigits(records.length)}</span></div>
                  </div>
                  {billings.length > 0 && (() => {
                    const totalBilled = billings.reduce((s, b) => s + parseInt(b.total_amount || 0), 0)
                    const totalPaid = billings.reduce((s, b) => s + parseInt(b.paid_amount || 0), 0)
                    const balance = totalBilled - totalPaid
                    return (
                      <div className="border-t border-surface-100 pt-4">
                        <h4 className="font-bold text-surface-700 mb-3 text-sm">خلاصه مالی</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="stat-card justify-center text-center p-3">
                            <div>
                              <div className="text-xs text-brand-500 font-medium">جمع صورت‌حساب</div>
                              <div className="text-base font-extrabold text-surface-800">{formatMoney(totalBilled)}</div>
                              <div className="text-[10px] text-surface-400">تومان</div>
                            </div>
                          </div>
                          <div className="stat-card justify-center text-center p-3">
                            <div>
                              <div className="text-xs text-success-500 font-medium">پرداخت شده</div>
                              <div className="text-base font-extrabold text-surface-800">{formatMoney(totalPaid)}</div>
                              <div className="text-[10px] text-surface-400">تومان</div>
                            </div>
                          </div>
                          <div className={`stat-card justify-center text-center p-3 ${balance > 0 ? 'border-rose-200' : 'border-success-200'}`}>
                            <div>
                              <div className={`text-xs font-medium ${balance > 0 ? 'text-rose-500' : 'text-success-500'}`}>مانده حساب</div>
                              <div className={`text-base font-extrabold ${balance > 0 ? 'text-rose-700' : 'text-success-700'}`}>{balance > 0 ? formatMoney(balance) : 'تسویه'}</div>
                              <div className={`text-[10px] ${balance > 0 ? 'text-rose-400' : 'text-success-400'}`}>{balance > 0 ? 'تومان' : 'کامل'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {filePreview && (
        <FilePreviewModal files={filePreview.files} initialIndex={filePreview.index}
          onClose={() => setFilePreview(null)} />
      )}
    </div>
  )
}
