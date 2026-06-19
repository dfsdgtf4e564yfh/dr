import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Plus, Search, Printer, Eye, Edit2, Trash2 } from 'lucide-react'
import { getTmsForms, createTmsForm, updateTmsForm, deleteTmsForm, getPatient, searchPatients } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toJalali, toPersianDigits, smartPersianDigits, formatAge } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'
import type { Patient, TmsForm as TmsFormType } from '../types'

interface SessionData {
  protocol: string
  duration: string
  course: string
}

interface TmsFormData {
  service_code: string
  current_mood: string
  current_psychotic: string
  current_substance: string
  current_anxiety: string
  current_cognitive: string
  current_physical: string
  current_personality_disorder: string
  current_ocd: string
  previous_diagnosis: string
  current_diagnosis: string
  treatment_history: string
  current_medications: string
  tms_usage: string
  qeeg_findings: string
  protocol1: string
  protocol2: string
  protocol3: string
  sessions: SessionData[]
  consent_patient_name: string
  consent_father_name: string
  consent_signature: string
}

const SESSION_COUNT = 30

function generatePrintHtml(data: Record<string, any>, patientInfo: Record<string, any> | null) {
  const p = patientInfo || {}
  const d = data || {}
  const sessions: Record<string, any>[] = d.sessions || []
  const today = toJalali(new Date().toISOString().split('T')[0])

  const sessionRows = Array.from({ length: SESSION_COUNT }, (_, i) => {
    const s = sessions[i] || {}
    return `<tr>
      <td style="text-align:center;font-weight:700;color:#1e3a5f;width:36px;">${toPersianDigits(i + 1)}</td>
      <td style="text-align:center;">${s.protocol || ''}</td>
      <td style="text-align:center;">${s.duration || ''}</td>
      <td>${s.course || ''}</td>
    </tr>`
  }).join('')

  return `<html dir="rtl"><head>
  <meta charset="UTF-8" />
  <title>فرم TMS</title>
  <style>
    @page { margin: 1.8cm 1.2cm; size: A4; }
    @font-face { font-family: 'Vazirmatn'; font-weight: 300; src: url('/fonts/webfonts/Vazirmatn-Light.woff2') format('woff2'); }
    @font-face { font-family: 'Vazirmatn'; font-weight: 400; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); }
    @font-face { font-family: 'Vazirmatn'; font-weight: 700; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); }
    @font-face { font-family: 'Vazirmatn'; font-weight: 900; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
      font-size: 9px; color: #1e293b; line-height: 1.8; padding: 0;
    }
    .page { page-break-after: always; }
    .brand { position: relative; text-align: center; padding-bottom: 10px; margin-bottom: 14px; }
    .brand::after { content: ''; position: absolute; bottom: 0; right: 30%; left: 30%; height: 1px; background: linear-gradient(90deg, transparent, #94a3b8, transparent); }
    .brand h1 { font-size: 14px; font-weight: 700; color: #1e3a5f; letter-spacing: 1px; }
    .brand .sub { font-size: 8px; color: #64748b; font-weight: 300; }
    .form-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 6px 10px; background: #fafafa; border: 1px solid #e2e8f0; }
    .form-meta .code-badge { background: #1e3a5f; color: #fff; padding: 3px 10px; font-size: 8px; font-weight: 700; letter-spacing: 0.5px; }
    .form-meta .date { font-size: 8px; color: #94a3b8; }
    .patient-box {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px 12px;
      padding: 8px 10px; border: 1px solid #e2e8f0; margin-bottom: 12px;
    }
    .patient-box .item { font-size: 8px; }
    .patient-box .item .lbl { color: #94a3b8; }
    .patient-box .item .val { color: #1e293b; font-weight: 700; margin-right: 3px; }
    .patient-box .item.full { grid-column: 1 / -1; }
    .section { margin-bottom: 10px; border: 1px solid #e2e8f0; }
    .section-title { background: #f8fafc; color: #1e3a5f; padding: 5px 10px; font-size: 9px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    .section-body { padding: 6px 10px; }
    .symptom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; }
    .symptom-item .lbl { font-weight: 700; color: #475569; font-size: 8px; }
    .symptom-item .val { color: #334155; font-size: 8px; padding-right: 4px; white-space: pre-wrap; }
    .symptom-item.full { grid-column: 1 / -1; }
    .protocol-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .protocol-box { border: 1px solid #e2e8f0; padding: 5px 6px; }
    .protocol-box .ptitle { font-weight: 700; color: #1e3a5f; font-size: 8px; margin-bottom: 2px; }
    .protocol-box .pval { font-size: 8px; white-space: pre-wrap; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; color: #475569; font-weight: 700; padding: 4px 5px; text-align: center; font-size: 8px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 3px 5px; text-align: center; font-size: 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tbody tr:last-child td { border-bottom: none; }
    .consent-box { margin-top: 14px; padding: 10px 12px; border: 1px solid #1e3a5f; background: #fafafa; }
    .consent-box p { font-size: 9px; line-height: 2.2; text-align: justify; }
    .consent-sign { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 6px; border-top: 1px solid #e2e8f0; }
    .consent-sign .field { font-size: 9px; }
    .consent-sign .field .flbl { color: #94a3b8; }
    .consent-sign .field .fval { font-weight: 700; margin-right: 3px; }
    .note-text { text-align: center; font-size: 8px; color: #64748b; padding: 6px; background: #f1f5f9; margin-bottom: 8px; font-weight: 700; }
  </style></head><body>
  <div class="page">
    <div class="brand">
      <h1>مطب تخصصی دکتر محمد طاهری</h1>
      <div class="sub">کلینیک تخصصی مغز و اعصاب و روان — فرم ارزیابی TMS</div>
    </div>
    <div class="form-meta">
      <div class="code-badge">کد خدمت: ${smartPersianDigits(d.service_code || '900115')}</div>
      <div class="date">تاریخ: ${toJalali(d.date) || today}</div>
    </div>
    <div class="patient-box">
      <div class="item"><span class="lbl">نام و نام خانوادگی:</span><span class="val">${p.first_name || ''} ${p.last_name || ''}</span></div>
      <div class="item"><span class="lbl">شماره پرونده:</span><span class="val">${p.file_number ? smartPersianDigits(p.file_number) : '—'}</span></div>
      <div class="item"><span class="lbl">سن:</span><span class="val">${p.age ? formatAge(p.age) : '—'}</span></div>
      <div class="item"><span class="lbl">تحصیلات:</span><span class="val">${p.education ? ({ ciclu: 'سیکل', diplom: 'دیپلم', super_diplom: 'فوق دیپلم', licence: 'لیسانس', master: 'فوق لیسانس', doctora: 'دکترا' }[p.education] || p.education) : '—'}</span></div>
      <div class="item"><span class="lbl">شغل:</span><span class="val">${({ doctor: 'پزشک', midwife: 'ماما', engineer: 'مهندس', nurse: 'پرستار', employee: 'کارمند', worker: 'کارگر', housewife: 'خانه دار', freelance: 'آزاد' })[p.job] || p.job || '—'}</span></div>
      <div class="item"><span class="lbl">پرونده قدیمی:</span><span class="val">${p.old_file_number ? smartPersianDigits(p.old_file_number) : '—'}</span></div>
      <div class="item"><span class="lbl">شماره تماس:</span><span class="val">${p.phone ? toPersianDigits(p.phone) : '—'}</span></div>
      <div class="item full"><span class="lbl">آدرس:</span><span class="val">${p.address || '—'}</span></div>
    </div>

    <div class="section">
      <div class="section-title">علائم جاری بیمار</div>
      <div class="section-body">
        <div class="symptom-grid">
          <div class="symptom-item"><div class="lbl">خلقی:</div><div class="val">${d.current_mood || '—'}</div></div>
          <div class="symptom-item"><div class="lbl">سایکوتیک:</div><div class="val">${d.current_psychotic || '—'}</div></div>
          <div class="symptom-item"><div class="lbl">ناشی از مواد:</div><div class="val">${d.current_substance || '—'}</div></div>
          <div class="symptom-item"><div class="lbl">اضطرابی:</div><div class="val">${d.current_anxiety || '—'}</div></div>
          <div class="symptom-item"><div class="lbl">شناختی:</div><div class="val">${d.current_cognitive || '—'}</div></div>
          <div class="symptom-item"><div class="lbl">جسمانی:</div><div class="val">${d.current_physical || '—'}</div></div>
          <div class="symptom-item"><div class="lbl">اختلال شخصیت:</div><div class="val">${d.current_personality_disorder || '—'}</div></div>
          <div class="symptom-item"><div class="lbl">اختلال وسواسی:</div><div class="val">${d.current_ocd || '—'}</div></div>
          <div class="symptom-item full"><div class="lbl">تشخیص قبلی:</div><div class="val">${d.previous_diagnosis || '—'}</div></div>
          <div class="symptom-item full"><div class="lbl">تشخیص فعلی:</div><div class="val">${d.current_diagnosis || '—'}</div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">سوابق درمانی</div>
      <div class="section-body"><div style="white-space:pre-wrap;">${d.treatment_history || '—'}</div></div>
    </div>

    <div class="section">
      <div class="section-title">داروهای مورد استفاده فعلی</div>
      <div class="section-body"><div style="white-space:pre-wrap;">${d.current_medications || '—'}</div></div>
    </div>

    <div class="section">
      <div class="section-title">موارد استفاده از TMS و یافته‌های QEEG</div>
      <div class="section-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><div style="font-weight:700;color:#475569;font-size:8px;">موارد استفاده از TMS:</div><div style="font-size:8px;white-space:pre-wrap;margin-top:2px;">${d.tms_usage || '—'}</div></div>
          <div><div style="font-weight:700;color:#475569;font-size:8px;">یافته‌های QEEG:</div><div style="font-size:8px;white-space:pre-wrap;margin-top:2px;">${d.qeeg_findings || '—'}</div></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">پروتکل درمانی</div>
      <div class="section-body">
        <div class="protocol-grid">
          <div class="protocol-box"><div class="ptitle">پروتکل ۱</div><div class="pval">${d.protocol1 || '—'}</div></div>
          <div class="protocol-box"><div class="ptitle">پروتکل ۲</div><div class="pval">${d.protocol2 || '—'}</div></div>
          <div class="protocol-box"><div class="ptitle">پروتکل ۳</div><div class="pval">${d.protocol3 || '—'}</div></div>
        </div>
      </div>
    </div>
  </div>

  <div class="page">
    <div class="brand">
      <h1>مطب تخصصی دکتر محمد طاهری</h1>
      <div class="sub">فرم TMS — جلسات درمان</div>
    </div>
    <div class="note-text">
      لازم به ذکر است که علائم بهبودی بعد از جلسه هشتم تا دوازدهم خود را نشان می‌دهد.
    </div>
    <table>
      <thead><tr>
        <th style="width:36px">جلسه</th>
        <th>نوع پروتکل</th>
        <th>مدت زمان</th>
        <th>سیر و عوارض</th>
      </tr></thead>
      <tbody>${sessionRows}</tbody>
    </table>
    <div class="consent-box">
      <p>
        اینجانب <strong>${d.consent_patient_name || '........................'}</strong>
        نام پدر <strong>${d.consent_father_name || '........................'}</strong>
        به صورت آگاهانه روش درمانی TMS را با اطلاع از عوارض جانبی و درمان‌های دیگر انتخاب نموده‌ام
        و رضایت از انجام درمان با TMS دارم و به سوالات پرسیده شده به دقت پاسخ داده‌ام.
      </p>
      <div class="consent-sign">
        <div class="field"><span class="flbl">نام و نام خانوادگی:</span><span class="fval">${d.consent_patient_name || '........................'}</span></div>
        <div class="field"><span class="flbl">امضا:</span><span class="fval">${d.consent_signature || '........................'}</span></div>
      </div>
    </div>
  </div>
</body></html>`
}

export default function TmsForms() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [searchParams] = useSearchParams()
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [patientSearching, setPatientSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<{ id: number } | null>(null)
  const [patientInfo, setPatientInfo] = useState<Record<string, any> | null>(null)
  const [date, setDate] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const patientSearchRef = useRef<HTMLDivElement | null>(null)

  const [formData, setFormData] = useState<TmsFormData>({
    service_code: '900115',
    current_mood: '',
    current_psychotic: '',
    current_substance: '',
    current_anxiety: '',
    current_cognitive: '',
    current_physical: '',
    current_personality_disorder: '',
    current_ocd: '',
    previous_diagnosis: '',
    current_diagnosis: '',
    treatment_history: '',
    current_medications: '',
    tms_usage: '',
    qeeg_findings: '',
    protocol1: '',
    protocol2: '',
    protocol3: '',
    sessions: [],
    consent_patient_name: '',
    consent_father_name: '',
    consent_signature: '',
  })

  useEffect(() => {
    loadForms()
  }, [])

  useEffect(() => {
    const patientId = searchParams.get('patient')
    if (patientId) {
      loadPatient(Number(patientId))
    }
  }, [searchParams])

  const loadForms = async () => {
    try {
      const { data } = await getTmsForms()
      setForms(Array.isArray(data) ? data : data.results || [])
    } catch {
      toast.error('متأسفانه در دریافت فرم‌های TMS خطایی رخ داد ')
    } finally {
      setLoading(false)
    }
  }

  const loadPatient = async (id: number) => {
    try {
      const { data } = await getPatient(id)
      setSelectedPatient(data)
      setPatientInfo(data)
      const todayStr = new Date().toISOString().split('T')[0]
      setDate(todayStr)
      setPatientSearch(`${data.first_name} ${data.last_name} - ${data.national_id}`)
      setFormData(prev => ({
        ...prev,
        consent_patient_name: `${data.first_name} ${data.last_name}`,
        consent_father_name: data.father_name || '',
      }))
      setShowForm(true)
    } catch {
      toast.error('متأسفانه در دریافت اطلاعات بیمار خطایی رخ داد ')
    }
  }

  const handlePatientSearch = useCallback((q: string) => {
    setPatientSearch(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!q.trim()) {
      setPatientResults([])
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setPatientSearching(true)
      try {
        const res = await searchPatients(q)
        const d = res.data as any
        setPatientResults(Array.isArray(d) ? d : d.results || [])
      } catch {
        setPatientResults([])
      } finally {
        setPatientSearching(false)
      }
    }, 400)
  }, [])

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setPatientInfo(patient)
    setPatientSearch(`${patient.first_name} ${patient.last_name} - ${patient.national_id}`)
    setPatientResults([])
    setFormData(prev => ({
      ...prev,
      consent_patient_name: `${patient.first_name} ${patient.last_name}`,
      consent_father_name: patient.father_name || '',
    }))
  }

  const clearPatient = () => {
    setSelectedPatient(null)
    setPatientInfo(null)
    setPatientSearch('')
    setFormData(prev => ({
      ...prev,
      consent_patient_name: '',
      consent_father_name: '',
    }))
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateSession = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const sessions = [...(prev.sessions || [])]
      if (!sessions[index]) sessions[index] = { protocol: '', duration: '', course: '' }
      sessions[index] = { ...sessions[index], [field]: value }
      return { ...prev, sessions }
    })
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setSelectedPatient(null)
    setPatientInfo(null)
    setPatientSearch('')
    setPatientResults([])
    setDate('')
    setFormData({
      service_code: '900115',
      current_mood: '',
      current_psychotic: '',
      current_substance: '',
      current_anxiety: '',
      current_cognitive: '',
      current_physical: '',
      current_personality_disorder: '',
      current_ocd: '',
      previous_diagnosis: '',
      current_diagnosis: '',
      treatment_history: '',
      current_medications: '',
      tms_usage: '',
      qeeg_findings: '',
      protocol1: '',
      protocol2: '',
      protocol3: '',
      sessions: [],
      consent_patient_name: '',
      consent_father_name: '',
      consent_signature: '',
    })
  }

  const openEdit = async (id: number) => {
    try {
      const { data } = await getTmsForms()
      const items = Array.isArray(data) ? data : data.results || []
      const form = items.find((f: any) => f.id === id)
      if (!form) { toast.error('متأسفانه فرم TMS مورد نظر یافت نشد '); return }
      setEditingId(id)
      setFormData({
        service_code: form.service_code || '900115',
        current_mood: form.current_mood || '',
        current_psychotic: form.current_psychotic || '',
        current_substance: form.current_substance || '',
        current_anxiety: form.current_anxiety || '',
        current_cognitive: form.current_cognitive || '',
        current_physical: form.current_physical || '',
        current_personality_disorder: form.current_personality_disorder || '',
        current_ocd: form.current_ocd || '',
        previous_diagnosis: form.previous_diagnosis || '',
        current_diagnosis: form.current_diagnosis || '',
        treatment_history: form.treatment_history || '',
        current_medications: form.current_medications || '',
        tms_usage: form.tms_usage || '',
        qeeg_findings: form.qeeg_findings || '',
        protocol1: form.protocol1 || '',
        protocol2: form.protocol2 || '',
        protocol3: form.protocol3 || '',
        sessions: form.sessions || [],
        consent_patient_name: form.consent_patient_name || '',
        consent_father_name: form.consent_father_name || '',
        consent_signature: form.consent_signature || '',
      })
      setDate(form.date || '')
      setSelectedPatient({ id: form.patient })
      setPatientInfo(form.patient_info || null)
      if (form.patient_info) {
        const p = form.patient_info
        setPatientSearch(`${p.first_name} ${p.last_name} - ${p.national_id}`)
      }
      setShowForm(true)
    } catch {
      toast.error('متأسفانه در دریافت اطلاعات فرم TMS خطایی رخ داد ')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient?.id) {
      toast.error('لطفاً ابتدا بیمار مورد نظر را انتخاب کنید ')
      return
    }
    if (!date) {
      toast.error('لطفاً تاریخ مربوطه را وارد کنید ')
      return
    }
    setSaving(true)
    const payload = {
      patient: selectedPatient.id,
      date,
      ...formData,
    }
    try {
      if (editingId) {
        await updateTmsForm(editingId, payload)
        toast.success('فرم TMS با موفقیت به‌روزرسانی شد ')
        resetForm()
        loadForms()
      } else {
        await createTmsForm(payload)
        toast.success('فرم TMS جدید با موفقیت ثبت شد ')
        const appointmentId = searchParams.get('appointment')
        if (appointmentId) {
          navigate(`/panel/waiting-list?openRecord=${appointmentId}`)
          return
        }
        resetForm()
        loadForms()
      }
    } catch (err: any) {
      const data = err?.response?.data
      const status = err?.response?.status
      let msg = 'متأسفانه در ذخیره فرم TMS خطایی رخ داد '
      if (data) {
        if (typeof data === 'string') {
          msg = data.substring(0, 200)
        } else if (data.detail) {
          msg = data.detail
        } else if (Array.isArray(data)) {
          msg = data[0]
        } else if (typeof data === 'object') {
          const keys = Object.keys(data)
          if (keys.length > 0) {
            const val = data[keys[0]]
            msg = Array.isArray(val) ? val[0] : String(val)
          }
        }
      }
      if (status) msg += ` (${status})`
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این فرم TMS اطمینان دارید؟')) return
    try {
      await deleteTmsForm(id)
      toast.success('فرم TMS با موفقیت حذف شد ')
      loadForms()
    } catch {
      toast.error('متأسفانه در حذف فرم TMS خطایی رخ داد ')
    }
  }

  const handlePrint = (form: Record<string, any>) => {
    const win = window.open('', '', 'width=900,height=650')
    if (win) {
      win.document.write(generatePrintHtml(form, form.patient_info))
      win.document.close()
      setTimeout(() => win.print(), 300)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" /></div>
  }

  if (showForm) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={resetForm} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
            ← بازگشت
          </button>
          <h2 className="text-lg font-bold">{editingId ? 'ویرایش فرم TMS' : 'فرم جدید TMS'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card">
            <div className="panel-header panel-header-iranian"><h3>اطلاعات فرم</h3></div>
            <div className="panel-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="label">بیمار <span className="text-red-500">*</span></label>
                  {selectedPatient && !patientSearching ? (
                    <div className="flex items-center gap-2">
                      <input className="input-field" value={patientSearch} readOnly />
                      <button type="button" onClick={clearPatient} className="text-red-500 text-sm">حذف</button>
                    </div>
                  ) : (
                    <div ref={patientSearchRef} className="relative" style={{ zIndex: 9999 }}>
                      <input className="input-field" placeholder="جستجوی بیمار..." value={patientSearch}
                        onChange={e => handlePatientSearch(e.target.value)} />
                      {patientResults.length > 0 && (
                        <div className="absolute z-[9999] top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto" style={{ position: 'absolute', left: 0, right: 0 }}>
                          {patientResults.map(p => (
                            <button key={p.id} type="button" onClick={() => selectPatient(p)}
                              className="w-full text-right px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 text-sm">
                              <div className="font-medium">{p.first_name} {p.last_name}</div>
                              <div className="text-xs text-gray-400">{toPersianDigits(p.national_id)} - {p.phone ? toPersianDigits(p.phone) : ''}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">تاریخ <span className="text-red-500">*</span></label>
                  <JalaliDateInput value={date} onChange={setDate} />
                </div>
                <div>
                  <label className="label">کد خدمت</label>
                  <input className="input-field ltr" value={formData.service_code}
                    onChange={e => updateField('service_code', e.target.value)} />
                </div>
              </div>
              {patientInfo && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="md:col-span-2"><span className="text-gray-500">نام و نام خانوادگی:</span> <span className="font-medium">{patientInfo.first_name} {patientInfo.last_name}</span></div>
                  <div><span className="text-gray-500">کد ملی:</span> <span className="font-medium ltr" dir="ltr">{toPersianDigits(patientInfo.national_id)}</span></div>
                  <div><span className="text-gray-500">نام پدر:</span> <span className="font-medium">{patientInfo.father_name || '—'}</span></div>
                  <div><span className="text-gray-500">شماره پرونده:</span> <span className="font-medium">{patientInfo.file_number ? smartPersianDigits(patientInfo.file_number) : '—'}</span></div>
                  <div><span className="text-gray-500">سن:</span> <span className="font-medium">{patientInfo.age ? formatAge(patientInfo.age) : '—'}</span></div>
                  <div><span className="text-gray-500">شماره تماس:</span> <span className="font-medium ltr" dir="ltr">{toPersianDigits(patientInfo.phone)}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">تحصیلات:</span> <span className="font-medium">{{
                    ciclu: 'سیکل', diplom: 'دیپلم', super_diplom: 'فوق دیپلم', licence: 'لیسانس', master: 'فوق لیسانس', doctora: 'دکترا'
                  }[patientInfo.education as string] || patientInfo.education || '—'}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">شغل:</span> <span className="font-medium">{{
                    doctor: 'پزشک', midwife: 'ماما', engineer: 'مهندس', nurse: 'پرستار',
                    employee: 'کارمند', worker: 'کارگر', housewife: 'خانه دار', freelance: 'آزاد'
                  }[patientInfo.job as string] || patientInfo.job || '—'}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">پرونده قدیمی:</span> <span className="font-medium">{patientInfo.old_file_number ? smartPersianDigits(patientInfo.old_file_number) : '—'}</span></div>
                  {patientInfo.address && <div className="col-span-4"><span className="text-gray-500">آدرس:</span> <span className="font-medium">{patientInfo.address}</span></div>}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="panel-header panel-header-iranian"><h3>علائم جاری بیمار</h3></div>
            <div className="panel-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">خلقی</label><textarea className="input-field" rows={2} value={formData.current_mood} onChange={e => updateField('current_mood', e.target.value)} /></div>
                <div><label className="label">سایکوتیک</label><textarea className="input-field" rows={2} value={formData.current_psychotic} onChange={e => updateField('current_psychotic', e.target.value)} /></div>
                <div><label className="label">ناشی از مواد</label><textarea className="input-field" rows={2} value={formData.current_substance} onChange={e => updateField('current_substance', e.target.value)} /></div>
                <div><label className="label">اضطرابی</label><textarea className="input-field" rows={2} value={formData.current_anxiety} onChange={e => updateField('current_anxiety', e.target.value)} /></div>
                <div><label className="label">شناختی</label><textarea className="input-field" rows={2} value={formData.current_cognitive} onChange={e => updateField('current_cognitive', e.target.value)} /></div>
                <div><label className="label">جسمانی</label><textarea className="input-field" rows={2} value={formData.current_physical} onChange={e => updateField('current_physical', e.target.value)} /></div>
                <div><label className="label">اختلال شخصیت</label><textarea className="input-field" rows={2} value={formData.current_personality_disorder} onChange={e => updateField('current_personality_disorder', e.target.value)} /></div>
                <div><label className="label">اختلال وسواسی</label><textarea className="input-field" rows={2} value={formData.current_ocd} onChange={e => updateField('current_ocd', e.target.value)} /></div>
                <div className="md:col-span-2"><label className="label">تشخیص قبلی</label><textarea className="input-field" rows={2} value={formData.previous_diagnosis} onChange={e => updateField('previous_diagnosis', e.target.value)} /></div>
                <div className="md:col-span-2"><label className="label">تشخیص فعلی</label><textarea className="input-field" rows={2} value={formData.current_diagnosis} onChange={e => updateField('current_diagnosis', e.target.value)} /></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="panel-header panel-header-iranian"><h3>سوابق درمانی</h3></div>
            <div className="panel-body">
              <textarea className="input-field" rows={3} value={formData.treatment_history} onChange={e => updateField('treatment_history', e.target.value)} />
            </div>
          </div>

          <div className="card">
            <div className="panel-header panel-header-iranian"><h3>داروهای مورد استفاده فعلی</h3></div>
            <div className="panel-body">
              <textarea className="input-field" rows={3} value={formData.current_medications} onChange={e => updateField('current_medications', e.target.value)} />
            </div>
          </div>

          <div className="card">
            <div className="panel-header panel-header-iranian"><h3>موارد استفاده از TMS و یافته‌های QEEG</h3></div>
            <div className="panel-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">موارد استفاده از TMS</label><textarea className="input-field" rows={3} value={formData.tms_usage} onChange={e => updateField('tms_usage', e.target.value)} /></div>
                <div><label className="label">یافته‌های QEEG</label><textarea className="input-field" rows={3} value={formData.qeeg_findings} onChange={e => updateField('qeeg_findings', e.target.value)} /></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="panel-header panel-header-iranian"><h3>پروتکل درمانی</h3></div>
            <div className="panel-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="label">پروتکل 1</label><textarea className="input-field" rows={3} value={formData.protocol1} onChange={e => updateField('protocol1', e.target.value)} /></div>
                <div><label className="label">پروتکل 2</label><textarea className="input-field" rows={3} value={formData.protocol2} onChange={e => updateField('protocol2', e.target.value)} /></div>
                <div><label className="label">پروتکل 3</label><textarea className="input-field" rows={3} value={formData.protocol3} onChange={e => updateField('protocol3', e.target.value)} /></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="panel-header panel-header-iranian"><h3>جلسات درمان</h3></div>
            <div className="panel-body">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-slate-100">
                    <tr>
                      <th className="p-2 text-center border w-12">جلسه</th>
                      <th className="p-2 text-center border">نوع پروتکل</th>
                      <th className="p-2 text-center border w-28">مدت زمان</th>
                      <th className="p-2 text-center border">سیر و عوارض</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: SESSION_COUNT }, (_, i) => {
                      const s = (formData.sessions?.[i] || {}) as { protocol?: string; duration?: string; course?: string }
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-1 text-center border font-bold text-slate-500 bg-slate-50">{toPersianDigits(i + 1)}</td>
                          <td className="p-1 border"><input className="input-field text-xs py-1" value={s.protocol || ''} onChange={e => updateSession(i, 'protocol', e.target.value)} /></td>
                          <td className="p-1 border"><input className="input-field text-xs py-1" value={s.duration || ''} onChange={e => updateSession(i, 'duration', e.target.value)} /></td>
                          <td className="p-1 border"><input className="input-field text-xs py-1" value={s.course || ''} onChange={e => updateSession(i, 'course', e.target.value)} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="panel-header panel-header-iranian"><h3>رضایت‌نامه</h3></div>
            <div className="panel-body space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm leading-relaxed">
                لازم به ذکر است که علائم بهبودی بعد از جلسه هشتم تا دوازدهم خود را نشان می‌دهد.
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm leading-relaxed">
                اینجانب <strong>{formData.consent_patient_name || '........................'}</strong>
                {' '}نام پدر <strong>{formData.consent_father_name || '........................'}</strong>
                {' '}به صورت آگاهانه روش درمانی TMS را با اطلاع از عوارض جانبی و درمان‌های دیگر انتخاب نموده‌ام
                و رضایت از انجام درمان با TMS دارم و به سوالات پرسیده شده به دقت پاسخ داده‌ام.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="label">نام و نام خانوادگی بیمار</label><input className="input-field" value={formData.consent_patient_name} onChange={e => updateField('consent_patient_name', e.target.value)} /></div>
                <div><label className="label">نام پدر</label><input className="input-field" value={formData.consent_father_name} onChange={e => updateField('consent_father_name', e.target.value)} /></div>
                <div><label className="label">امضا</label><input className="input-field" value={formData.consent_signature} onChange={e => updateField('consent_signature', e.target.value)} placeholder="نام و نام خانوادگی" /></div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'در حال ذخیره...' : editingId ? 'ویرایش فرم TMS' : 'ثبت فرم TMS'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">انصراف</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">فرم‌های TMS</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> فرم جدید TMS
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p>هیچ فرم TMS ثبت نشده است</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="text-center py-3 px-2">ردیف</th>
                <th className="text-center py-3 px-2">بیمار</th>
                <th className="text-center py-3 px-2">تاریخ</th>
                <th className="text-center py-3 px-2">پزشک / درمانگر</th>
                <th className="text-center py-3 px-2">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f, idx) => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2">{toPersianDigits(idx + 1)}</td>
                  <td className="py-3 px-2 font-medium">{f.patient_name}</td>
                  <td className="py-3 px-2">{toJalali(f.date)}</td>
                  <td className="py-3 px-2">{f.doctor_name}</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handlePrint(f)} className="action-btn" title="چاپ"><Printer size={15} /></button>
                      <button onClick={() => openEdit(f.id)} className="action-btn" title="ویرایش"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(f.id)} className="action-btn text-red-500" title="حذف"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
