import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, X, AlertTriangle, List } from 'lucide-react'
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
      setRecordInfo(data)
      setForm({
        patient: data.patient,
        session_number: data.session_number,
        date: data.date,
        diagnosis: '', treatment_plan: '', notes: '', prescription: '',
        uploaded_files: [],
      })
      setShowModal(true)
    } catch {
      toast.error('متأسفانه در دریافت اطلاعات بیمار خطایی رخ داد ')
    }
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
    } catch {
      toast.error('متأسفانه در ثبت پرونده خطایی رخ داد ')
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
                <th>ردیف</th>
                <th>بیمار</th>
                <th>پزشک</th>
                <th>ساعت</th>
                <th>نوع درمان</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr></thead>
              <tbody>
                {apps.map((a: any, i: number) => (
                  <tr key={a.id}>
                    <td className="font-bold text-brand-500">{toPersianDigits(i + 1)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center text-xs font-bold">
                          {a.patient_name?.[0] || '?'}
                        </div>
                        <span>{a.patient_name}</span>
                      </div>
                    </td>
                    <td>{a.doctor_name}</td>
                    <td>{a.time}</td>
                    <td>{a.treatment_name}</td>
                    <td>
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
                    <td>
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
                    <th>ردیف</th>
                    <th>بیمار</th>
                    <th>پزشک</th>
                    <th>تاریخ</th>
                    <th>ساعت</th>
                    <th>نوع درمان</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr></thead>
                  <tbody>
                    {pastApps.map((a: any, i: number) => (
                      <tr key={a.id}>
                        <td className="font-bold text-amber-500">{toPersianDigits(i + 1)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">
                              {a.patient_name?.[0] || '?'}
                            </div>
                            <span>{a.patient_name}</span>
                          </div>
                        </td>
                        <td>{a.doctor_name}</td>
                        <td>{toJalali(a.date)}</td>
                        <td>{a.time}</td>
                        <td>{a.treatment_name}</td>
                        <td>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            {a.status === 'scheduled' ? 'در انتظار' :
                             a.status === 'completed' ? 'انجام شده' :
                             a.status === 'cancelled' ? 'لغو شده' : 'تغییر یافته'}
                          </span>
                        </td>
                        <td>
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

      {tmsWarning && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">فرم TMS ثبت نشده</h3>
            <p className="text-sm text-slate-500 mb-2">
              بیمار <strong>{tmsWarning.patientName}</strong> دارای نوبت TMS/RTMS است اما فرم TMS برای ایشان ثبت نشده.
            </p>
            <p className="text-sm text-slate-500 mb-6">لطفاً ابتدا فرم TMS را ثبت کنید.</p>
            <div className="flex gap-3">
              <button onClick={() => navigate(`/tms-forms/new?patient=${tmsWarning.patientId}`)}
                className="flex-1 py-3 bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold rounded-2xl">
                ثبت فرم TMS
              </button>
              <button onClick={() => setTmsWarning(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl">
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && recordInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">ثبت پرونده پزشکی - {recordInfo.patient_name}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div><span className="text-slate-500">نام بیمار:</span> <span className="font-bold">{recordInfo.patient_name}</span></div>
              <div><span className="text-slate-500">کد ملی:</span> <span className="font-bold" dir="ltr">{toPersianDigits(recordInfo.national_id)}</span></div>
              <div><span className="text-slate-500">شماره جلسه:</span> <span className="font-bold">{toPersianDigits(recordInfo.session_number)}</span></div>
              <div><span className="text-slate-500">تاریخ:</span> <span className="font-bold">{toJalali(recordInfo.date)}</span></div>
              <div><span className="text-slate-500">تلفن:</span> <span className="font-bold" dir="ltr">{toPersianDigits(recordInfo.phone)}</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">تشخیص</label>
                <div className="relative mb-1">
                  <button type="button" onClick={() => setShowDiagList(!showDiagList)} className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded mb-1 hover:bg-brand-100">+ تشخیص‌های آماده</button>
                  {showDiagList && (
                    <div className="absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto w-full">
                      {commonDiagnoses.map((d: any) => (
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
                  <button type="button" onClick={() => setShowTreatmentList(!showTreatmentList)} className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded mb-1 hover:bg-brand-100">+ طرح‌های درمان آماده</button>
                  {showTreatmentList && (
                    <div className="absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto w-full">
                      {commonTreatmentPlans.map((t: any) => (
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
                  <button type="button" onClick={() => setShowDrugList(!showDrugList)} className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded mb-1 hover:bg-brand-100">+ داروهای آماده</button>
                  {showDrugList && (
                    <div className="absolute z-10 top-full right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto w-full">
                      {commonDrugs.map((d: any) => (
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
              </div>
              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? 'در حال ذخیره...' : 'تایید ویزیت و ثبت پرونده'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
