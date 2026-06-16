import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, X, AlertTriangle, List, Stethoscope, Pill, FileText, ClipboardList } from 'lucide-react'
import { getWaitingList, cancelAppointment, completeAppointment, getRecordInfo, createMedicalRecord, getCommonDiagnoses, getCommonDrugs, getCommonTreatmentPlans, getTmsForms } from '../services/api'
import { toPersianDigits, toJalali } from '../utils/jalali'
import { SkeletonCard } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import type { CommonDiagnosis, CommonDrug } from '../types'

interface WaitingListForm {
  patient: number | string
  session_number: string
  date: string
  diagnosis: string
  treatment_plan: string
  notes: string
  prescription: string
  uploaded_files: File[]
}

export default function WaitingList() {
  const [apps, setApps] = useState<any[]>([])
  const [pastApps, setPastApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const modalRef = useRef<HTMLDivElement>(null)

  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recordInfo, setRecordInfo] = useState<any>(null)
  const [tmsWarning, setTmsWarning] = useState<any>(null)
  const [form, setForm] = useState<WaitingListForm>({
    patient: '', session_number: '', date: '', diagnosis: '',
    treatment_plan: '', notes: '', prescription: '', uploaded_files: [],
  })
  const [commonDiagnoses, setCommonDiagnoses] = useState<any[]>([])
  const [commonDrugs, setCommonDrugs] = useState<any[]>([])
  const [commonTreatmentPlans, setCommonTreatmentPlans] = useState<any[]>([])
  const [showDiagList, setShowDiagList] = useState(false)
  const [showDrugList, setShowDrugList] = useState(false)
  const [showTreatmentList, setShowTreatmentList] = useState(false)

  useEffect(() => {
    getCommonDiagnoses().then((res) => { const d = res.data as any; setCommonDiagnoses(d.results || d) }).catch(() => {})
    getCommonDrugs().then((res) => { const d = res.data as any; setCommonDrugs(d.results || d) }).catch(() => {})
    getCommonTreatmentPlans().then((res) => { const d = res.data as any; setCommonTreatmentPlans(d.results || d) }).catch(() => {})
  }, [])

  useEffect(() => {
    const openRecordId = searchParams.get('openRecord')
    if (openRecordId) {
      getRecordInfo(Number(openRecordId)).then(({ data }) => {
        openRecordModal(data)
        navigate('/panel/waiting-list', { replace: true })
      }).catch(() => toast.error('متأسفانه در دریافت اطلاعات بیمار خطایی رخ داد '))
    }
  }, [searchParams])

  const fetchList = () => {
    setLoading(true)
    getWaitingList()
      .then(({ data }) => {
        setApps(Array.isArray(data) ? data : data.today || [])
        setPastApps(data.past_pending || [])
      })
      .catch(() => toast.error('متأسفانه در دریافت لیست انتظار خطایی رخ داد '))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchList() }, [])

  const handleComplete = async (id: number) => {
    try {
      const { data } = await getRecordInfo(id)
      if (data.treatment_name && /tms|rtms/i.test(data.treatment_name)) {
        const formsRes = await getTmsForms({ patient: data.patient })
        const formsData = formsRes.data as any
        const existingForms = formsData.results || formsData || []
        if (existingForms.length === 0) {
          setTmsWarning({ patientId: data.patient, patientName: data.patient_name, recordInfo: data, appointmentId: id })
          return
        }
      }
      openRecordModal(data)
    } catch {
      toast.error('متأسفانه در دریافت اطلاعات بیمار خطایی رخ داد ')
    }
  }

  const openRecordModal = (data: any) => {
    setRecordInfo(data)
    setForm({
      patient: data.patient,
      session_number: data.session_number,
      date: data.date,
      diagnosis: '', treatment_plan: '', notes: '', prescription: '',
      uploaded_files: [],
    })
    setShowModal(true)
  }

  const handleCancel = (id: number) => {
    cancelAppointment(id)
      .then(() => { toast.success('نوبت با موفقیت از لیست انتظار لغو شد'); fetchList() })
      .catch(() => toast.error('متأسفانه در لغو نوبت خطایی رخ داد '))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, uploaded_files: Array.from(e.target.files || []) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recordInfo) return
    setSaving(true)
    try {
      await completeAppointment(recordInfo.appointment)
      await createMedicalRecord({
        ...form,
        doctor: recordInfo.doctor,
        appointment: recordInfo.appointment,
      })
      toast.success('ویزیت با موفقیت تایید و پرونده پزشکی ثبت شد ')
      setShowModal(false)
      fetchList()
    } catch (err: any) {
      const resp = err?.response?.data
      let msg = 'متأسفانه در ثبت پرونده خطایی رخ داد'
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
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <SkeletonCard count={4} />

  const todayDateStr = new Date().toLocaleDateString('fa-IR')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">لیست انتظار بیماران</h1>
        <span className="text-sm text-slate-400">امروز {toPersianDigits(todayDateStr)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-sm text-slate-400">کل نوبت‌های امروز</p>
          <p className="text-2xl font-extrabold text-brand-500">{toPersianDigits(apps.length)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-400">در انتظار</p>
          <p className="text-2xl font-extrabold text-amber-500">{toPersianDigits(apps.filter((a: any) => a.status === 'scheduled').length)}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-slate-400">انجام شده</p>
          <p className="text-2xl font-extrabold text-green-500">{toPersianDigits(apps.filter((a: any) => a.status === 'completed').length)}</p>
        </div>
      </div>

      <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
        <Clock size={18} className="text-brand-500" />
        نوبت‌های امروز
      </h2>

      {apps.length === 0 ? (
        <EmptyState icon={List} title="نوبتی برای امروز وجود ندارد" description="همه نوبت‌های امروز مدیریت شده‌اند." />
      ) : (
        <div className="panel card-iranian">
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th className="text-center">ردیف</th>
                <th className="text-center">بیمار</th>
                <th className="text-center">پزشک / درمانگر</th>
                <th className="text-center">ساعت</th>
                <th className="text-center">نوع درمان</th>
                <th className="text-center">وضعیت</th>
                <th className="text-center">عملیات</th>
              </tr></thead>
              <tbody>
                {apps.map((a: any, i: number) => (
                  <tr key={a.id}>
                    <td className="text-center font-bold text-brand-500">{toPersianDigits(i + 1)}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center text-xs font-bold">
                          {a.patient_name?.[0] || '?'}
                        </div>
                        <span>{a.patient_name}</span>
                      </div>
                    </td>
                    <td className="text-center">{a.doctor_name}</td>
                    <td className="text-center">{a.time}</td>
                    <td className="text-center">{a.treatment_name}</td>
                    <td className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        a.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        a.status === 'completed' ? 'bg-green-100 text-green-700' :
                        a.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {a.status === 'scheduled' ? 'در انتظار' :
                         a.status === 'completed' ? 'انجام شده' :
                         a.status === 'cancelled' ? 'لغو شده' : 'تغییر یافته'}
                      </span>
                    </td>
                    <td className="text-center">
                      {a.status === 'scheduled' ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleComplete(a.id)} className="btn-success px-3 py-1 text-xs flex items-center gap-1">
                            <CheckCircle size={14} /> تایید
                          </button>
                          <button onClick={() => handleCancel(a.id)} className="btn-danger px-3 py-1 text-xs flex items-center gap-1">
                            <XCircle size={14} /> لغو
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pastApps.length > 0 && (
        <>
          <div className="border-t border-amber-200 pt-5">
            <h2 className="text-base font-bold text-amber-700 flex items-center gap-2 mb-4">
              <AlertTriangle size={18} />
              لیست روزهای قبل — نوبت‌های معوق مانده از روزهای گذشته
            </h2>
            <div className="panel border-amber-200">
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th className="text-center">ردیف</th>
                    <th className="text-center">بیمار</th>
                    <th className="text-center">پزشک / درمانگر</th>
                    <th className="text-center">تاریخ</th>
                    <th className="text-center">ساعت</th>
                    <th className="text-center">نوع درمان</th>
                    <th className="text-center">وضعیت</th>
                    <th className="text-center">عملیات</th>
                  </tr></thead>
                  <tbody>
                    {pastApps.map((a: any, i: number) => (
                    <tr key={a.id}>
                      <td className="text-center font-bold text-amber-500">{toPersianDigits(i + 1)}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">
                            {a.patient_name?.[0] || '?'}
                          </div>
                          <span>{a.patient_name}</span>
                        </div>
                      </td>
                      <td className="text-center">{a.doctor_name}</td>
                      <td className="text-center">{toJalali(a.date)}</td>
                      <td className="text-center">{a.time}</td>
                      <td className="text-center">{a.treatment_name}</td>
                      <td className="text-center">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            {a.status === 'scheduled' ? 'در انتظار' :
                             a.status === 'completed' ? 'انجام شده' :
                             a.status === 'cancelled' ? 'لغو شده' : 'تغییر یافته'}
                          </span>
                        </td>
                        <td className="text-center">
                          {a.status === 'scheduled' ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleComplete(a.id)} className="btn-success px-3 py-1 text-xs flex items-center gap-1">
                                <CheckCircle size={14} /> تایید
                              </button>
                              <button onClick={() => handleCancel(a.id)} className="btn-danger px-3 py-1 text-xs flex items-center gap-1">
                                <XCircle size={14} /> لغو
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {tmsWarning && createPortal(
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[60] flex items-start justify-center overflow-y-auto pt-10 p-4" onClick={() => setTmsWarning(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl text-center my-10" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">فرم TMS ثبت نشده</h3>
            <p className="text-sm text-slate-500 mb-2">
              بیمار <strong>{tmsWarning.patientName}</strong> دارای نوبت TMS/RTMS است اما فرم TMS برای ایشان ثبت نشده.
            </p>
            <p className="text-xs text-slate-400 mb-4">در صورت تمایل ابتدا فرم TMS را ثبت کنید یا بدون ثبت ادامه دهید.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate(`/panel/tms-forms/new?patient=${tmsWarning.patientId}&appointment=${tmsWarning.appointmentId}`)}
                className="w-full py-2.5 bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold rounded-xl text-sm">
                ثبت فرم TMS
              </button>
              <button onClick={() => { const d = tmsWarning.recordInfo; setTmsWarning(null); openRecordModal(d) }}
                className="w-full py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl text-sm hover:bg-slate-200 transition-colors">
                ادامه بدون ثبت فرم TMS
              </button>
              <button onClick={() => setTmsWarning(null)}
                className="text-xs text-slate-400 py-1 hover:text-slate-600 transition-colors">
                انصراف
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showModal && recordInfo && createPortal(
        <div ref={modalRef} className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto pt-10 p-4 bg-black/35 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col animate-fade-in-up my-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                  <ClipboardList size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">ثبت پرونده پزشکی</h3>
                  <p className="text-xs text-slate-400">{recordInfo.patient_name}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 mb-1">شماره جلسه</p>
                  <p className="text-sm font-bold text-slate-700">{toPersianDigits(recordInfo.session_number)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 mb-1">تاریخ</p>
                  <p className="text-sm font-bold text-slate-700">{toJalali(recordInfo.date)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 mb-1">کد ملی</p>
                  <p className="text-sm font-bold text-slate-700" dir="ltr">{toPersianDigits(recordInfo.national_id)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 mb-1">تلفن</p>
                  <p className="text-sm font-bold text-slate-700" dir="ltr">{toPersianDigits(recordInfo.phone)}</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                    <Stethoscope size={14} className="text-brand-500" /> تشخیص
                  </label>
                  <div className="relative mb-1">
                    <button type="button" onClick={() => setShowDiagList(!showDiagList)}
                      className="text-[11px] text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors">
                      + تشخیص‌های آماده
                    </button>
                    {showDiagList && (
                      <div className="absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-36 overflow-y-auto w-64 mt-1">
                        {commonDiagnoses.map((d: any) => (
                          <div key={d.id} className="px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer border-b border-slate-50 text-slate-600"
                            onClick={() => { setForm({ ...form, diagnosis: form.diagnosis ? form.diagnosis + '\n' + d.title : d.title }); setShowDiagList(false) }}>
                            {d.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea className="input-field" rows={2} value={form.diagnosis}
                    onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="تشخیص را وارد کنید..." />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                    <FileText size={14} className="text-brand-500" /> طرح درمان
                  </label>
                  <div className="relative mb-1">
                    <button type="button" onClick={() => setShowTreatmentList(!showTreatmentList)}
                      className="text-[11px] text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors">
                      + طرح‌های درمان آماده
                    </button>
                    {showTreatmentList && (
                      <div className="absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-36 overflow-y-auto w-64 mt-1">
                        {commonTreatmentPlans.map((t: any) => (
                          <div key={t.id} className="px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer border-b border-slate-50 text-slate-600"
                            onClick={() => { setForm({ ...form, treatment_plan: form.treatment_plan ? form.treatment_plan + '\n' + t.title : t.title }); setShowTreatmentList(false) }}>
                            {t.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea className="input-field" rows={2} value={form.treatment_plan}
                    onChange={e => setForm({ ...form, treatment_plan: e.target.value })} placeholder="طرح درمان را وارد کنید..." />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                    <FileText size={14} className="text-brand-500" /> یادداشت‌های پزشک
                  </label>
                  <textarea className="input-field" rows={2} value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="یادداشت‌های خود را وارد کنید..." />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">
                    <Pill size={14} className="text-brand-500" /> نسخه
                  </label>
                  <div className="relative mb-1">
                    <button type="button" onClick={() => setShowDrugList(!showDrugList)}
                      className="text-[11px] text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors">
                      + داروهای آماده
                    </button>
                    {showDrugList && (
                      <div className="absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-36 overflow-y-auto w-80 mt-1">
                        {commonDrugs.map((d: any) => (
                          <div key={d.id} className="px-3 py-2 text-sm hover:bg-brand-50 cursor-pointer border-b border-slate-50 text-slate-600"
                            onClick={() => { setForm({ ...form, prescription: form.prescription ? form.prescription + '\n' + `${d.name} - ${d.default_dosage} ${d.dosage_unit}` : `${d.name} - ${d.default_dosage} ${d.dosage_unit}` }); setShowDrugList(false) }}>
                            {d.name} - {d.default_dosage} {d.dosage_unit}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <textarea className="input-field" rows={2} value={form.prescription}
                    onChange={e => setForm({ ...form, prescription: e.target.value })} placeholder="نسخه را وارد کنید..." />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1.5">آپلود فایل</label>
                  <input type="file" multiple className="input-field" onChange={handleFileChange} accept="image/*,.pdf" />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={saving}>
                  {saving ? 'در حال ذخیره...' : 'تایید ویزیت و ثبت پرونده'}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
