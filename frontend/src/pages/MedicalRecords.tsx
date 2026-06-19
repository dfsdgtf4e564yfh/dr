import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Plus, Search, FileText, Trash2, Printer, Image, ChevronDown, Edit2, CheckCircle, XCircle, Mic } from 'lucide-react'
import { getMedicalRecords, createMedicalRecord, updateMedicalRecord, deleteMedicalRecord, getCommonDiagnoses, getCommonDrugs, getCommonTreatmentPlans, getClinicSettings, getDoctors } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toJalali, toPersianDigits, smartPersianDigits, escapeHtml, mediaUrl } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'
import FilePreviewModal from '../components/FilePreviewModal'
import Modal from '../components/Modal'
import Button from '../components/Button'
import PatientSearchSelect from '../components/PatientSearchSelect'
import EmptyState from '../components/EmptyState'
import type { User, MedicalRecord, RecordFile, CommonDiagnosis, CommonDrug, ClinicSettings } from '../types'
import VoiceRecorder from '../components/VoiceRecorder'

interface GroupItem {
  patient: number
  name: string
  national_id: string
  file_number: string
  last_date: string
  records: MedicalRecord[]
}

interface MedicalRecordForm {
  patient: number | string
  session_number: string
  date: string
  diagnosis: string
  treatment_plan: string
  notes: string
  prescription: string
  uploaded_files: File[]
}

type FilePreviewItem = { name: string; size: number }

function getPrescriptionNumber(r: MedicalRecord) {
  return r.id ? toPersianDigits(r.id) : ''
}

function generatePrescriptionHTML(r: MedicalRecord, user: User | null, clinicSettings: ClinicSettings | null) {
  const h = (s: string) => escapeHtml(s)
  const clinicPhone = clinicSettings?.phone || ''
  const clinicPhone2 = clinicSettings?.phone2 || ''
  const clinicPhone3 = clinicSettings?.phone3 || ''
  const clinicAddress = clinicSettings?.address || ''
  const clinicName = clinicSettings?.clinic_name || 'کلینیک تخصصی اعصاب و روان'
  const signatureImg = user?.signature ? `<img src="${h(mediaUrl(user.signature))}" alt="امضای پزشک" style="height:56px;width:auto;" />` : ''
  const today = toJalali(new Date().toISOString().split('T')[0])
  const fileCount = r.files?.length || 0

  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
<meta charset="UTF-8">
<title>نسخه پزشکی | ${h(r.patient_name)}</title>
<style>
  @page { size: A5 portrait; margin: 12mm; }
  @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-Regular.woff2') format('woff2'); font-weight: 400; }
  @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); font-weight: 500; }
  @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); font-weight: 700; }
  @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); font-weight: 800; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
    font-size: 11px; color: #1e293b; line-height: 1.7;
    background: #fff; padding: 0;
  }
  .paper {
    width: 100%; max-width: 148mm; margin: 0 auto;
    background: #fff; position: relative;
  }
  /* Header */
  .header {
    position: relative; padding-bottom: 14px; margin-bottom: 14px;
    border-bottom: 2px solid #1a4a8a;
  }
  .header::before {
    content: ''; position: absolute; top: 0; right: 0; left: 0; height: 4px;
    background: linear-gradient(90deg, #1a4a8a 0%, #2ab3b8 50%, #1a4a8a 100%);
    border-radius: 2px;
  }
  .header-top {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding-top: 14px;
  }
  .header-right { text-align: right; }
  .clinic-name { font-size: 17px; font-weight: 800; color: #0c2647; letter-spacing: 0.3px; }
  .clinic-sub { font-size: 10px; color: #5f5547; margin-top: 3px; font-weight: 500; }
  .header-left { text-align: left; }
  .date-box {
    display: inline-block; background: linear-gradient(135deg, #f0fdfa, #eff6ff);
    border: 1px solid rgba(26,74,138,0.12); border-radius: 10px;
    padding: 6px 14px; text-align: center;
  }
  .date-box .lbl { font-size: 9px; color: #64748b; display: block; }
  .date-box .val { font-size: 12px; font-weight: 700; color: #1a4a8a; }
  /* Doctor bar */
  .doctor-bar {
    display: flex; align-items: baseline; gap: 10px; margin: 12px 0;
    padding: 8px 14px; background: linear-gradient(135deg, #f0fdfa, #f8fafc);
    border-right: 4px solid #2ab3b8; border-radius: 8px;
  }
  .doctor-bar .doc-name { font-size: 15px; font-weight: 700; color: #0f766e; }
  .doctor-bar .doc-spec { font-size: 10px; color: #64748b; }
  .doctor-bar .doc-council { font-size: 9px; color: #94a3b8; margin-right: 8px; }
  /* Info grid */
  .info-wrap {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 6px; margin-bottom: 14px;
    background: #faf7f2; border: 1px solid #e8e0d3;
    border-radius: 10px; padding: 10px 12px;
  }
  .info-wrap .item { display: flex; gap: 4px; font-size: 10px; }
  .info-wrap .item .lbl { color: #7d7160; font-weight: 500; }
  .info-wrap .item .val { color: #27221b; font-weight: 700; }
  /* Sections */
  .section { margin-bottom: 12px; }
  .section-title {
    font-size: 10px; font-weight: 800; color: #1a4a8a;
    border-bottom: 1.5px solid #1a4a8a; padding-bottom: 4px; margin-bottom: 6px;
    display: flex; align-items: center; gap: 6px; letter-spacing: 0.3px;
  }
  .section-title .line {
    flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(26,74,138,0.15), transparent);
  }
  .section-body {
    font-size: 11px; color: #1e293b; white-space: pre-wrap;
    padding: 2px 4px; line-height: 1.9;
  }
  /* Prescription box */
  .rx-box {
    border: 1.5px solid #1a4a8a; border-radius: 10px; padding: 14px 16px;
    margin-bottom: 14px; background: #fdfefe; position: relative;
  }
  .rx-box .rx-title {
    position: absolute; top: -10px; right: 18px;
    background: linear-gradient(135deg, #1a4a8a, #2563eb);
    color: #fff; font-size: 9px; padding: 2px 14px;
    border-radius: 20px; font-weight: 700;
  }
  .rx-item { padding: 5px 0; border-bottom: 1px dashed #e2e8f0; font-size: 11.5px; line-height: 1.8; }
  .rx-item:last-child { border-bottom: none; }
  .rx-item::before { content: '—'; color: #2ab3b8; margin-left: 8px; font-weight: 700; }
  /* Signature */
  .sig-wrap {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-top: 16px; padding-top: 14px;
    border-top: 1.5px dashed #d4c9b8;
  }
  .sig-area { text-align: center; min-width: 120px; }
  .sig-img { min-height: 44px; display: flex; align-items: center; justify-content: center; }
  .sig-line {
    border-top: 1px solid #b8ab96; width: 120px; margin: 4px auto 0;
    padding-top: 4px; font-size: 9px; color: #5f5547; font-weight: 500;
  }
  /* Footer */
  .footer {
    margin-top: 14px; padding-top: 10px;
    border-top: 2px solid #1a4a8a; position: relative;
  }
  .footer::before {
    content: ''; position: absolute; top: -2px; right: 0; left: 0; height: 2px;
    background: linear-gradient(90deg, #1a4a8a 0%, #2ab3b8 50%, #1a4a8a 100%);
  }
  .footer-grid {
    display: flex; justify-content: space-between; align-items: flex-start;
    font-size: 9px; color: #5f5547; line-height: 1.8;
  }
  .footer-grid .lbl { color: #7d7160; font-weight: 600; }
  .footer-note {
    margin-top: 8px; text-align: center; font-size: 8px; color: #9c8e7a;
    font-weight: 500;
  }
  @media print {
    body { background: #fff; margin: 0; }
    .paper { max-width: 100%; }
  }
</style>
</head>
<body>
<div class="paper">
  <div class="header">
    <div class="header-top">
      <div class="header-right">
        <div class="clinic-name">${h(clinicName)}</div>
        <div class="clinic-sub">کلینیک تخصصی مغز و اعصاب و روان</div>
      </div>
      <div class="header-left">
        <div class="date-box">
          <span class="lbl">تاریخ نسخه</span>
          <span class="val">${toJalali(r.date) || today}</span>
        </div>
      </div>
    </div>
    <div class="doctor-bar">
      <span class="doc-name">${h(user?.first_name || '')} ${h(user?.last_name || '')}</span>
      <span class="doc-spec">${h(user?.specialization || 'متخصص اعصاب و روان')}</span>
      ${user?.medical_council_number ? `<span class="doc-council">نظام پزشکی: ${toPersianDigits(user.medical_council_number)}</span>` : ''}
    </div>
  </div>

  <div class="info-wrap">
    <div class="item"><span class="lbl">بیمار:</span><span class="val">${h(r.patient_name)}</span></div>
    <div class="item"><span class="lbl">شماره نسخه:</span><span class="val">${getPrescriptionNumber(r)}</span></div>
    ${r.session_number ? `<div class="item"><span class="lbl">شماره جلسه:</span><span class="val">${toPersianDigits(r.session_number)}</span></div>` : ''}
    ${fileCount > 0 ? `<div class="item"><span class="lbl">پیوست:</span><span class="val">${toPersianDigits(fileCount)} فایل</span></div>` : ''}
  </div>

  ${r.diagnosis ? `
  <div class="section">
    <div class="section-title">تشخیص پزشکی</div>
    <div class="section-body">${h(r.diagnosis)}</div>
  </div>` : ''}

  ${r.treatment_plan ? `
  <div class="section">
    <div class="section-title">طرح درمان</div>
    <div class="section-body">${h(r.treatment_plan)}</div>
  </div>` : ''}

  ${r.prescription ? `
  <div class="rx-box">
    <div class="rx-title">نسخه دارویی</div>
    ${r.prescription.split('\n').filter((line: string) => line.trim()).map((line: string) => `<div class="rx-item">${h(line)}</div>`).join('')}
  </div>` : ''}

  ${r.notes ? `
  <div class="section">
    <div class="section-title">یادداشت‌های پزشکی</div>
    <div class="section-body">${h(r.notes)}</div>
  </div>` : ''}

  <div class="sig-wrap">
    <div style="font-size:9px;color:#7d7160;font-weight:500;">
      <div>شماره نسخه: <strong>${getPrescriptionNumber(r)}</strong></div>
      <div style="margin-top:2px;">تاریخ: ${toJalali(r.date) || today}</div>
    </div>
    <div class="sig-area">
      <div class="sig-img">${signatureImg || '<span style="color:#b8ab96;font-size:10px;">—</span>'}</div>
      <div class="sig-line">امضا و مهر پزشک معالج</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-grid">
      <div>
        ${clinicAddress ? `<div><span class="lbl">آدرس کلینیک:</span> ${h(clinicAddress)}</div>` : ''}
        <div><span class="lbl">تلفن تماس:</span> ${toPersianDigits(clinicPhone)}${clinicPhone2 ? ` / ${toPersianDigits(clinicPhone2)}` : ''}${clinicPhone3 ? ` / ${toPersianDigits(clinicPhone3)}` : ''}</div>
      </div>
      <div style="text-align:left;">
        <div style="font-size:8px;color:#9c8e7a;">این نسخه به صورت الکترونیکی صادر شده است</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`
}

export default function MedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [expandedPatients, setExpandedPatients] = useState<Record<number, boolean>>({})
  const [patientFilter, setPatientFilter] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const { user, hasPermission } = useAuth()
  const [form, setForm] = useState<MedicalRecordForm>({
    patient: '', session_number: '', date: '', diagnosis: '',
    treatment_plan: '', notes: '', prescription: '', uploaded_files: [],
  })
  const [filePreviews, setFilePreviews] = useState<FilePreviewItem[]>([])
  const [commonDiagnoses, setCommonDiagnoses] = useState<CommonDiagnosis[]>([])
  const [commonDrugs, setCommonDrugs] = useState<CommonDrug[]>([])
  const [commonTreatmentPlans, setCommonTreatmentPlans] = useState<any[]>([])
  const [showDiagList, setShowDiagList] = useState(false)
  const [showDrugList, setShowDrugList] = useState(false)
  const [showTreatmentList, setShowTreatmentList] = useState(false)
  const [filePreview, setFilePreview] = useState<{ files: RecordFile[]; index: number } | null>(null)
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null)
  const [doctors, setDoctors] = useState<User[]>([])

  useEffect(() => {
    getCommonDiagnoses().then((res) => { const d = res.data as any; setCommonDiagnoses(Array.isArray(d) ? d : d.results || []) }).catch(() => {})
    getCommonDrugs().then((res) => { const d = res.data as any; setCommonDrugs(Array.isArray(d) ? d : d.results || []) }).catch(() => {})
    getCommonTreatmentPlans().then((res) => { const d = res.data as any; setCommonTreatmentPlans(Array.isArray(d) ? d : d.results || []) }).catch(() => {})
    getClinicSettings().then((res) => {
      const d = res.data as any
      setClinicSettings(Array.isArray(d) ? d[0] : d)
    }).catch(() => {})
    getDoctors().then((res) => { const d = res.data as any; setDoctors(Array.isArray(d) ? d : d.results || d) }).catch(() => {})
  }, [])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (patientFilter) params.patient = patientFilter
      if (doctorFilter) params.doctor = doctorFilter
      const { data } = await getMedicalRecords(params)
      setRecords(Array.isArray(data) ? data : data.results || [])
    } catch { toast.error('متأسفانه در دریافت پرونده‌ها مشکلی پیش اومد', { icon: <XCircle size={20} /> }) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadRecords() }, [patientFilter, doctorFilter])

  const grouped = records.reduce<Record<number, GroupItem>>((acc, r) => {
    const pid = r.patient
    if (!acc[pid]) {
      acc[pid] = {
        patient: pid,
        name: r.patient_name,
        national_id: r.patient_national_id || '',
        file_number: r.patient_file_number || '',
        last_date: r.date,
        records: [],
      }
    }
    acc[pid].records.push(r)
    if (r.date > acc[pid].last_date) acc[pid].last_date = r.date
    return acc
  }, {})

  const groupList: GroupItem[] = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))

  const toggleExpand = (pid: number) => {
    setExpandedPatients(prev => ({ ...prev, [pid]: !prev[pid] }))
  }

  const expandAll = () => {
    const all: Record<number, boolean> = {}
    groupList.forEach(g => { all[g.patient] = true })
    setExpandedPatients(all)
  }

  const collapseAll = () => setExpandedPatients({})

  const openNew = () => {
    setEditing(null)
    setForm({ patient: '', session_number: '', date: '', diagnosis: '', treatment_plan: '', notes: '', prescription: '', uploaded_files: [] })
    setFilePreviews([])
    setSearchTerm('')
    setShowModal(true)
  }

  const openEdit = (r: MedicalRecord) => {
    setEditing(r.id)
    setForm({
      patient: r.patient, session_number: String(r.session_number), date: r.date,
      diagnosis: r.diagnosis || '', treatment_plan: r.treatment_plan || '',
      notes: r.notes || '', prescription: r.prescription || '', uploaded_files: [],
    })
    setSearchTerm(r.patient_name)
    setShowModal(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setForm({ ...form, uploaded_files: files })
    setFilePreviews(files.map(f => ({ name: f.name, size: f.size })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateMedicalRecord(editing, form)
        toast.success('پرونده پزشکی با موفقیت ویرایش شد', { icon: <CheckCircle size={20} /> })
      } else {
        await createMedicalRecord({ ...form, doctor: (user as User).id })
        toast.success('پرونده پزشکی جدید با موفقیت ثبت شد', { icon: <CheckCircle size={20} /> })
      }
      setShowModal(false)
      loadRecords()
    } catch (err: any) {
      const resp = err?.response?.data
      let msg = 'متأسفانه خطایی در ثبت پرونده رخ داد'
      if (resp) {
        if (typeof resp === 'string') msg = resp
        else if (resp.error) msg = resp.error
        else if (resp.detail) msg = resp.detail
        else if (typeof resp === 'object') {
          const firstKey = Object.keys(resp)[0]
          const firstErr = resp[firstKey]
          msg = Array.isArray(firstErr) ? firstErr[0] : typeof firstErr === 'string' ? firstErr : msg
        }
      }
      toast.error(msg, { icon: <XCircle size={20} /> })
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا از حذف این پرونده اطمینان دارید؟')) return
    try {
      await deleteMedicalRecord(id)
      toast.success('پرونده پزشکی با موفقیت حذف شد', { icon: <CheckCircle size={20} /> })
      loadRecords()
    } catch { toast.error('متأسفانه در حذف پرونده مشکلی پیش اومد', { icon: <XCircle size={20} /> }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-extrabold text-slate-800">پرونده‌های پزشکی</h1>
        <div className="flex gap-2 flex-wrap">
          {hasPermission('medical_record_create') && (
            <Button onClick={openNew} icon={Plus}>پرونده جدید</Button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-slate-600">فیلتر بیمار:</span>
          <input className="input-field max-w-xs" placeholder="شناسه بیمار" value={patientFilter}
            onChange={e => setPatientFilter(e.target.value)} />
          <span className="text-sm font-medium text-slate-600">پزشک / درمانگر:</span>
          <select className="input-field max-w-[180px]" value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}>
            <option value="">همه پزشکان</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
          </select>
          <Button size="xs" variant="ghost" onClick={expandAll}>باز کردن همه</Button>
          <Button size="xs" variant="ghost" onClick={collapseAll}>بستن همه</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" /></div>
      ) : (
        <div className="space-y-3">
          {groupList.length === 0 ? (
            <EmptyState icon={FileText} title="پرونده‌ای یافت نشد" description="برای ثبت پرونده جدید از دکمه بالا استفاده کنید." action={hasPermission('medical_record_create') ? <Button onClick={openNew} icon={Plus}>پرونده جدید</Button> : null} />
          ) : groupList.map(g => {
            const isOpen = expandedPatients[g.patient]
            const count = g.records.length
            return (
              <div key={g.patient} className="card p-0 overflow-hidden">
                <button onClick={() => toggleExpand(g.patient)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-right">
                  <ChevronDown size={18} className={`text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-gray-800">{g.name}</span>
                    <span className="mx-2 text-xs text-slate-400">|</span>
                    <span className="text-sm text-slate-500">کد ملی: {toPersianDigits(g.national_id || '—')}</span>
                    {g.file_number && (
                      <><span className="mx-2 text-xs text-slate-400">|</span><span className="text-sm text-slate-500">پرونده: {smartPersianDigits(g.file_number)}</span></>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm shrink-0">
                    <span className="text-slate-400">{toPersianDigits(count)} جلسه</span>
                    <span className="text-slate-400">آخرین: {toJalali(g.last_date)}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100">
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th className="text-center">شماره جلسه</th>
                            <th className="text-center">تاریخ</th>
                            <th className="text-center">پزشک / درمانگر</th>
                            <th className="text-center">تشخیص</th>
                            <th className="text-center">طرح درمان</th>
                            <th className="text-center">فایل‌ها</th>
                            <th className="text-center">عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.records.map(r => (
                            <tr key={r.id}>
                              <td className="text-center font-medium">{toPersianDigits(r.session_number)}</td>
                              <td className="text-center text-sm">{toJalali(r.date)}</td>
                              <td className="text-center text-sm">{r.doctor_name}</td>
                              <td className="text-center text-sm max-w-[150px] truncate" title={r.diagnosis}>{r.diagnosis || '—'}</td>
                              <td className="text-center text-sm max-w-[150px] truncate" title={r.treatment_plan}>{r.treatment_plan || '—'}</td>
                              <td className="text-center">
                                {r.files?.length > 0 ? (
                                  <div className="flex gap-1 justify-center">
                                    {r.files.map((f, i) => {
                                      const isImg = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f.file)
                                      return (
                                        <button key={f.id} onClick={() => setFilePreview({ files: r.files!, index: i })}
                                          className="text-xs bg-gray-100 px-1.5 py-1 rounded hover:bg-gray-200" title={f.description || 'فایل'}>
                                          {isImg ? <Image size={12} /> : <FileText size={12} />}
                                        </button>
                                      )
                                    })}
                                  </div>
                                ) : '—'}
                              </td>
                              <td className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {r.prescription && (
                                    <button onClick={() => {
                                      const win = window.open('', '', 'width=600,height=800')!
                                      win.document.write(generatePrescriptionHTML(r, user as User, clinicSettings))
                                      win.document.close()
                                    }} className="btn-action text-teal-600" title="چاپ نسخه"><Printer size={15} /></button>
                                  )}
                                  {hasPermission('medical_record_edit') && (
                                    <button onClick={() => openEdit(r)} className="btn-action text-blue-600" title="ویرایش"><Edit2 size={15} /></button>
                                  )}
                                  {hasPermission('medical_record_delete') && (
                                    <button onClick={() => handleDelete(r.id)} className="btn-action btn-action-danger" title="حذف"><Trash2 size={15} /></button>
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
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} size="lg" title={editing ? 'ویرایش پرونده' : 'پرونده جدید'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">بیمار</label>
              <PatientSearchSelect
                value={searchTerm}
                onSelect={(p: any) => { setForm({ ...form, patient: p.id }); setSearchTerm(`${p.first_name} ${p.last_name}`) }}
                minChars={2}
              />
            </div>
            <div><label className="label">شماره جلسه</label><input type="number" className="input-field" value={form.session_number} onChange={e => setForm({ ...form, session_number: e.target.value })} required /></div>
            <div><label className="label">تاریخ جلسه</label><JalaliDateInput value={form.date} onChange={(v: string) => setForm({ ...form, date: v })} required /></div>
          </div>
          <div>
            <label className="label">تشخیص</label>
            <div className="relative mb-1">
              <Button type="button" size="xs" variant="ghost" onClick={() => setShowDiagList(!showDiagList)}>+ تشخیص‌های آماده</Button>
              {showDiagList && (
                <div className="absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto w-full">
                  {commonDiagnoses.map(d => (
                    <div key={d.id} className="px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer border-b border-slate-50"
                      onClick={() => { setForm({ ...form, diagnosis: form.diagnosis ? form.diagnosis + '\n' + d.title : d.title }); setShowDiagList(false) }}>
                      {d.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <textarea className="input-field" rows={2} value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
          </div>
          <div>
            <label className="label">طرح درمان</label>
            <div className="relative mb-1">
              <Button type="button" size="xs" variant="ghost" onClick={() => setShowTreatmentList(!showTreatmentList)}>+ طرح‌های درمان آماده</Button>
              {showTreatmentList && (
                <div className="absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto w-full">
                  {commonTreatmentPlans.map(t => (
                    <div key={t.id} className="px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer border-b border-slate-50"
                      onClick={() => { setForm({ ...form, treatment_plan: form.treatment_plan ? form.treatment_plan + '\n' + t.title : t.title }); setShowTreatmentList(false) }}>
                      {t.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <textarea className="input-field" rows={2} value={form.treatment_plan} onChange={e => setForm({ ...form, treatment_plan: e.target.value })} />
          </div>
          <div><label className="label">یادداشت‌های پزشک</label><textarea className="input-field" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div>
            <label className="label">نسخه</label>
            <div className="relative mb-1">
              <Button type="button" size="xs" variant="ghost" onClick={() => setShowDrugList(!showDrugList)}>+ داروهای آماده</Button>
              {showDrugList && (
                <div className="absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto w-full">
                  {commonDrugs.map(d => (
                    <div key={d.id} className="px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer border-b border-slate-50"
                      onClick={() => { setForm({ ...form, prescription: form.prescription ? form.prescription + '\n' + `${d.name} - ${d.default_dosage} ${d.dosage_unit}` : `${d.name} - ${d.default_dosage} ${d.dosage_unit}` }); setShowDrugList(false) }}>
                      {d.name} - {d.default_dosage} {d.dosage_unit}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <textarea className="input-field" rows={2} value={form.prescription} onChange={e => setForm({ ...form, prescription: e.target.value })} />
          </div>
          <div>
            <label className="label">آپلود فایل (مدارک تصویری)</label>
            <input type="file" multiple className="input-field" onChange={handleFileChange} accept="image/*,.pdf" />
            {filePreviews.length > 0 && (
              <div className="mt-2 text-sm text-slate-500">{toPersianDigits(filePreviews.length)} فایل انتخاب شد</div>
            )}
          </div>
          <Button type="submit" variant="gradient" className="w-full">{editing ? 'ذخیره تغییرات' : 'ثبت پرونده'}</Button>
        </form>
      </Modal>

      {filePreview && (
        <FilePreviewModal files={filePreview.files} initialIndex={filePreview.index}
          onClose={() => setFilePreview(null)} />
      )}
    </div>
  )
}
