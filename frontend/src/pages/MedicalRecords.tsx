import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Plus, Search, FileText, Trash2, Printer, Image, ChevronDown, Edit2, CheckCircle, XCircle } from 'lucide-react'
import { getMedicalRecords, createMedicalRecord, updateMedicalRecord, deleteMedicalRecord, getCommonDiagnoses, getCommonDrugs, getCommonTreatmentPlans, getClinicSettings, getDoctors } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toJalali, toPersianDigits, escapeHtml } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'
import FilePreviewModal from '../components/FilePreviewModal'
import Modal from '../components/Modal'
import Button from '../components/Button'
import PatientSearchSelect from '../components/PatientSearchSelect'
import EmptyState from '../components/EmptyState'
import type { User, MedicalRecord, RecordFile, CommonDiagnosis, CommonDrug, ClinicSettings } from '../types'

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
  const clinicPhone = (clinicSettings?.phone || '').replace(/-/g, '')
  const clinicPhone2 = (clinicSettings?.phone2 || '').replace(/-/g, '')
  const clinicAddress = clinicSettings?.address || ''
  const signatureImg = user?.signature ? `<img src="${h(user.signature)}" alt="امضای پزشک" style="height:50px;width:auto;" />` : ''
  const today = toJalali(new Date().toISOString().split('T')[0])
  const fileCount = r.files?.length || 0

  return `
  <html dir="rtl"><head><title>نسخه پزشک</title>
  <style>
    @page { size: A5; margin: 0.6cm; }
    @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-Regular.woff2') format('woff2'); font-weight: 400; }
    @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); font-weight: 700; }
    @font-face { font-family: 'Vazirmatn'; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); font-weight: 800; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.6; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .main-wrap { width: 100%; max-width: 450px; padding: 4px 12px; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e293b; padding-bottom: 8px; margin-bottom: 10px; }
    .hdr .clinic { font-size: 16px; font-weight: 800; }
    .hdr .date { font-size: 10px; color: #64748b; }
    .info-grid { display: flex; flex-wrap: wrap; gap: 4px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; }
    .info-grid .ig-item { display: flex; gap: 3px; font-size: 10px; }
    .info-grid .ig-item .ig-lbl { color: #94a3b8; }
    .info-grid .ig-item .ig-val { font-weight: 700; color: #1e293b; }
    .section { margin-bottom: 8px; }
    .section-title { font-size: 10px; font-weight: 800; color: #475569; border-bottom: 1px dashed #cbd5e1; padding-bottom: 3px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    .section-body { font-size: 10.5px; color: #1e293b; white-space: pre-wrap; padding: 0 2px; min-height: 28px; }
    .sig-wrap { border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 8px; display: flex; align-items: center; justify-content: space-between; }
    .sig-img { min-height: 40px; display: flex; align-items: center; }
    .sig-line { font-size: 9px; color: #94a3b8; }
    .footer { margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 9px; color: #94a3b8; line-height: 1.5; }
    .footer .flbl { font-weight: 600; color: #64748b; }
    @media print { body { margin: 0; } }
  </style></head>
  <body><div class="main-wrap">
    <div class="hdr"><div class="clinic">${h(clinicSettings?.clinic_name || 'کلینیک تخصصی اعصاب و روان')}</div><div class="date">${today}</div></div>
    <div class="info-grid">
      <div class="ig-item"><span class="ig-lbl">بیمار:</span><span class="ig-val">${h(r.patient_name)}</span></div>
      <div class="ig-item"><span class="ig-lbl">پزشک:</span><span class="ig-val">${h(user?.first_name || '')} ${h(user?.last_name || '')}</span></div>
      <div class="ig-item"><span class="ig-lbl">شماره نسخه:</span><span class="ig-val">${getPrescriptionNumber(r)}</span></div>
      ${r.session_number ? `<div class="ig-item"><span class="ig-lbl">جلسه:</span><span class="ig-val">${toPersianDigits(r.session_number)}</span></div>` : ''}
      <div class="ig-item"><span class="ig-lbl">تاریخ:</span><span class="ig-val">${toJalali(r.date)}</span></div>
    </div>
    ${r.diagnosis ? `<div class="section"><div class="section-title">تشخیص</div><div class="section-body">${h(r.diagnosis)}</div></div>` : ''}
    ${r.treatment_plan ? `<div class="section"><div class="section-title">طرح درمان</div><div class="section-body">${h(r.treatment_plan)}</div></div>` : ''}
    ${r.prescription ? `<div class="section"><div class="section-title">داروها</div><div class="section-body">${h(r.prescription)}</div></div>` : ''}
    ${r.notes ? `<div class="section"><div class="section-title">یادداشت‌ها</div><div class="section-body">${h(r.notes)}</div></div>` : ''}
    ${fileCount > 0 ? `<div class="section"><div class="section-title">فایل‌ها</div><div class="section-body">${toPersianDigits(fileCount)} فایل ضمیمه شده است</div></div>` : ''}
    <div class="sig-wrap">
      <div class="sig-img">${signatureImg || '<span style="color:#cbd5e1;font-size:10px;">—</span>'}</div>
      <div class="sig-line">امضای پزشک</div>
    </div>
    <div class="footer">
      ${clinicAddress ? `<div class="faddr"><span class="flbl">آدرس:</span> ${h(clinicAddress)}</div>` : ''}
      <div class="fphone"><span class="flbl">تلفن:</span> ${toPersianDigits(clinicPhone)}${clinicPhone2 ? ` | ${toPersianDigits(clinicPhone2)}` : ''}</div>
    </div>
  </div></body></html>`
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
  const { user, hasRole } = useAuth()
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
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'متأسفانه خطایی در ثبت پرونده رخ داد', { icon: <XCircle size={20} /> })
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
          {hasRole('admin', 'doctor') && (
            <Button onClick={openNew} icon={Plus}>پرونده جدید</Button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-slate-600">فیلتر بیمار:</span>
          <input className="input-field max-w-xs" placeholder="شناسه بیمار" value={patientFilter}
            onChange={e => setPatientFilter(e.target.value)} />
          <span className="text-sm font-medium text-slate-600">پزشک:</span>
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
            <EmptyState icon={FileText} title="پرونده‌ای یافت نشد" description="برای ثبت پرونده جدید از دکمه بالا استفاده کنید." action={hasRole('admin', 'doctor') ? <Button onClick={openNew} icon={Plus}>پرونده جدید</Button> : null} />
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
                      <><span className="mx-2 text-xs text-slate-400">|</span><span className="text-sm text-slate-500">پرونده: {toPersianDigits(g.file_number)}</span></>
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
                            <th className="text-center">پزشک</th>
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
                              <td className="text-sm max-w-[150px] truncate" title={r.diagnosis}>{r.diagnosis || '—'}</td>
                              <td className="text-sm max-w-[150px] truncate" title={r.treatment_plan}>{r.treatment_plan || '—'}</td>
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
                                  {hasRole('admin', 'doctor') && (
                                    <>
                                      <button onClick={() => openEdit(r)} className="btn-action text-blue-600" title="ویرایش"><Edit2 size={15} /></button>
                                      <button onClick={() => handleDelete(r.id)} className="btn-action btn-action-danger" title="حذف"><Trash2 size={15} /></button>
                                    </>
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
