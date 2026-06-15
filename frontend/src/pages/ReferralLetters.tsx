import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { Plus, X, FileText, Trash2, Search, ArrowDown, Printer, Inbox, Send, Paperclip } from 'lucide-react'
import { getReferralLetters, getReferralLetter, createReferralLetter, deleteReferralLetter, searchPatients, getClinicSettings, getReferralRecipients, createSupportMessage } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toJalali, toPersianDigits, smartPersianDigits } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'
import type { ReferralLetter, Patient, User, ClinicSettings } from '../types'

interface ReferralForm {
  patient: number | string
  to_doctor: string
  to_user: number | string
  to_user_name: string
  date: string
  description: string
  status: string
  file: File | null
}

const statusLabels: Record<string, string> = {
  sent: 'ارسال شده',
  received: 'دریافت شده',
  answered: 'پاسخ داده شده',
}

const statusColors: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  received: 'bg-amber-100 text-amber-700',
  answered: 'bg-green-100 text-green-700',
}

export default function ReferralLetters() {
  const [letters, setLetters] = useState<ReferralLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { hasRole, user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [direction, setDirection] = useState<string>('sent')
  const [internalMode, setInternalMode] = useState(false)
  const [alsoInternal, setAlsoInternal] = useState(false)
  const [supportTarget, setSupportTarget] = useState(false)
  const [form, setForm] = useState<ReferralForm>({
    patient: '', to_doctor: '', to_user: '', to_user_name: '', date: '', description: '', status: 'sent', file: null,
  })
  const [printData, setPrintData] = useState<ReferralLetter | null>(null)
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getClinicSettings().then(({ data }) => {
      const s = Array.isArray(data) ? data[0] : data
      if (s) setClinicSettings(s)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    getReferralRecipients().then((res) => {
      const d = res.data as any
      const all = Array.isArray(d) ? d : d.results || []
      setUsers(all.filter((u: User) => u.id !== user?.id))
    }).catch(() => { setUsers([]) })
  }, [user])

  const load = async () => {
    setLoading(true)
    try {
      const res = await getReferralLetters({ direction })
      const data = res.data as any
      setLetters(data.results || data)
    } catch { toast.error('متأسفانه در دریافت نامه‌ها خطایی رخ داد ') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [direction])

  const handleSearchPatient = async (q: string) => {
    setSearchTerm(q)
    if (q.length < 2) return
    try {
      const res = await searchPatients(q)
      const data = res.data as any
      setPatients(Array.isArray(data) ? data : data.results || [])
    } catch (err) { console.error('Referral patient search error:', err) }
  }

  const selectPatient = (p: Patient) => {
    setForm(prev => ({
      ...prev,
      patient: p.id,
      description: internalMode ? `بیمار ${p.first_name} ${p.last_name}\n\n` : `همکار ارجمند باسلام و احترام\n\nبیمار ${p.gender === 'female' ? 'سرکار خانم' : 'جناب آقای'} ${p.first_name} ${p.last_name} با شماره پرونده ${p.file_number ? smartPersianDigits(p.file_number) : '_________'} از تاریخ ${p.first_visit_date ? toJalali(p.first_visit_date) : '_________'} لغایت ${prev.date || '_________'} با نشانه‌ها و علائم\n\n\nجهت بررسی و اقدام درمانی لازم به حضورتان معرفی می‌گردد.`,
    }))
    setSearchTerm(`${p.first_name} ${p.last_name}`)
    setPatients([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let desc = form.description
    if (internalMode && form.to_user && form.to_user_name) {
      desc = `ارسال به: ${form.to_user_name}\n\n${desc}`
    } else if (!internalMode && form.to_doctor) {
      desc = `به پزشک/مرکز: ${form.to_doctor}\n\n${desc}`
    }
    const payload: Record<string, any> = {
      ...form,
      description: toPersianDigits(desc),
      to_doctor: toPersianDigits(form.to_doctor),
    }
    if (internalMode) {
      delete payload.to_doctor
      payload.to_user = Number(form.to_user)
    } else {
      if (alsoInternal && form.to_user) {
        payload.to_user = Number(form.to_user)
      } else {
        delete payload.to_user
      }
    }
    try {
      if (supportTarget) {
        await createSupportMessage({ user: form.patient as number, message: form.description } as any)
        toast.success('پیام شما با موفقیت به پشتیبانی ارسال شد ')
      } else {
        const { data } = await createReferralLetter(payload)
        toast.success('نامه ارجاع با موفقیت ثبت و آماده چاپ شد ')
        const full = await getReferralLetter(data.id)
        setPrintData(full.data)
        setTimeout(() => { document.getElementById('print-modal')?.scrollIntoView({ behavior: 'smooth' }) }, 100)
      }
      setShowModal(false)
      load()
    } catch { toast.error('متأسفانه در ثبت نامه خطایی رخ داد ') }
  }

  const handlePrint = async (id: number) => {
    try {
      const { data } = await getReferralLetter(id)
      setPrintData(data)
    } catch { toast.error('متأسفانه در دریافت اطلاعات نامه خطایی رخ داد ') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('حذف شود؟')) return
    try { await deleteReferralLetter(id); toast.success('نامه ارجاع با موفقیت حذف شد '); load() }
    catch { toast.error('متأسفانه در حذف نامه خطایی رخ داد ') }
  }

  useEffect(() => {
    if (printData) {
      const patientName = printData.patient_name || ''
      const genderPrefix = printData.patient_gender === 'female' ? 'سرکار خانم' : 'جناب آقای'
      setFeedbackText(
        `همکار ارجمند باسلام و احترام\n\n` +
        `ضمن تشکر، بیمار ${genderPrefix} ${patientName} در تاریخ _________ پذیرش گردید و پس از معاینه با تشخیص _________ اقدامات لازم با نتیجه زیر برای وی انجام شد.\n\n` +
        `1 – ______________________\n` +
        `2 – ______________________\n` +
        `3 – ______________________\n\n` +
        `لازم است نامبرده به شرح ذیل مورد پیگیری قرار گیرد:\n\n` +
        `1 – ______________________\n` +
        `2 – ______________________\n` +
        `3 – ______________________`
      )
    }
  }, [printData])

  const doPrint = () => {
    const content = printRef.current
    if (!content) return
    const clinicPhone = clinicSettings?.phone || ''
    const clinicPhone2 = clinicSettings?.phone2 || ''
    const clinicPhone3 = clinicSettings?.phone3 || ''
    const clinicAddress = clinicSettings?.address || ''
    const win = window.open('', '', 'width=900,height=700')
    if (!win) { toast.error('لطفاً پنجره پاپ‌آپ را در مرورگر خود مجاز کنید '); return }

    const feedbackHtml = feedbackText
      .split('\n')
      .map(line => line.trim() ? `<div>${line}</div>` : '<br>')
      .join('')

    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>نامه ارجاع</title>
<style>
  @page { margin: 0; size: A5; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @font-face { font-family: 'Vazirmatn'; font-weight: 300; src: url('/fonts/webfonts/Vazirmatn-Light.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 400; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 700; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 900; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); }
  body {
    font-family: 'Vazirmatn', Tahoma, sans-serif;
    background: #f8f9fb; padding: 20px; font-size: 10px; color: #1e293b;
  }
  .print-page {
    max-width: 210mm; margin: 0 auto;
    background: #fff; padding: 28px 32px; position: relative;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border: 2px solid #000;
  }
  .ref-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
  .ref-top .from { font-size: 12px; font-weight: 700; color: #1e3a5f; }
  .ref-top .date-line { font-size: 9px; color: #94a3b8; }
  .ref-top .date-line .dt-lbl { color: #cbd5e1; }
  .ref-top .date-line .dt-val { color: #334155; font-weight: 700; }
  .ref-to { font-size: 10px; color: #475569; margin-bottom: 16px; padding: 8px 12px; background: #fafafa; border: 1px solid #e2e8f0; }
  .ref-to .to-lbl { color: #94a3b8; }
  .ref-to .to-val { color: #1e293b; font-weight: 700; }
  .ref-body { font-size: 11px; color: #334155; line-height: 2.8; margin: 16px 0; text-align: justify; white-space: pre-line; }
  .ref-body .highlight { color: #0f766e; font-weight: 700; }
  .ref-body .dots { color: #cbd5e1; letter-spacing: 2px; }
  .ref-action { font-size: 11px; color: #1e293b; font-weight: 500; margin: 14px 0 20px; }
  .ref-sig { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px dashed #d1d5db; }
  .ref-sig .sig-label { font-size: 9px; color: #94a3b8; margin-bottom: 2px; }
  .ref-sig .sig-name { font-size: 10px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
  .ref-sig .sig-stamp { font-size: 9px; color: #94a3b8; }
  .ref-sig .sig-img { max-height: 40px; max-width: 120px; object-fit: contain; margin-top: 4px; }
  .feedback-wrap { margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e3a5f; }
  .feedback-title { font-size: 11px; font-weight: 900; color: #1e3a5f; margin-bottom: 14px; text-align: center; }
  .feedback-body { font-size: 10px; color: #334155; line-height: 2.6; margin-bottom: 14px; text-align: justify; white-space: pre-line; }
  .feedback-sig { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px dashed #d1d5db; }
  .feedback-sig .sig-label { font-size: 9px; color: #94a3b8; }
  .feedback-sig .sig-name { font-size: 10px; font-weight: 700; color: #1e293b; margin-bottom: 2px; }
  .feedback-sig .sig-stamp { font-size: 9px; color: #94a3b8; }
  .print-footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8px; color: #94a3b8; line-height: 1.8; }
  .print-footer .flbl { color: #cbd5e1; }
  .print-footer .fval { color: #64748b; }
  .print-btn { display: block; width: 180px; margin: 16px auto; padding: 10px; background: #1e3a5f; color: #fff; border: none; font-size: 12px; font-family: 'Vazirmatn', sans-serif; cursor: pointer; font-weight: 700; }
  .print-btn:hover { background: #1e2d4a; }
  @media print { .print-btn { display: none; } body { background: #fff; padding: 0; } .print-page { box-shadow: none; padding: 20px 28px; } }
</style></head><body>`)
    const innerHtml = content.innerHTML.replace(/<textarea[^>]*>.*?<\/textarea>/s, `<div class="feedback-body" style="font-size:10px;color:#334155;line-height:2.6;text-align:justify;white-space:pre-line">${feedbackHtml}</div>`)
    const clinicFooter = clinicAddress || clinicPhone ? `<div class="print-footer">${clinicAddress ? `<div><span class="flbl">آدرس:</span><span class="fval"> ${clinicAddress}</span></div>` : ''}${clinicPhone ? `<div><span class="flbl">تلفن:</span><span class="fval"> ${toPersianDigits(clinicPhone)}${clinicPhone2 ? ` | ${toPersianDigits(clinicPhone2)}` : ''}${clinicPhone3 ? ` | ${toPersianDigits(clinicPhone3)}` : ''}</span></div>` : ''}</div>` : ''
    win.document.write(`<div class="print-page">${innerHtml}${clinicFooter}</div>`)
    win.document.write(`<button class="print-btn" onclick="window.print()">چاپ نامه</button>`)
    win.document.write('</body></html>')
    win.document.close()
    setTimeout(() => { win.focus() }, 300)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">نامه‌های ارجاع</h1>
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 rounded-xl p-0.5 flex">
            <button onClick={() => setDirection('sent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${direction === 'sent' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Send size={14} className="inline ml-1" />ارسال شده
            </button>
            <button onClick={() => setDirection('received')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${direction === 'received' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Inbox size={14} className="inline ml-1" />دریافت شده
            </button>
          </div>
          {hasRole('admin', 'doctor') && (
            <button onClick={() => { setForm({ patient: '', to_doctor: '', to_user: '', to_user_name: '', date: '', description: '', status: 'sent', file: null }); setSearchTerm(''); setInternalMode(false); setAlsoInternal(false); setShowModal(true) }}
              className="btn-primary flex items-center gap-2"><Plus size={18} /> ارجاع جدید</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" /></div>
      ) : letters.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <FileText size={48} className="mx-auto text-slate-200 mb-3" />
          نامه ارجاعی ثبت نشده
        </div>
      ) : (
        <div className="space-y-3">
          {letters.map(l => (
            <div key={l.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-500 flex-shrink-0">
                    <ArrowDown size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{toPersianDigits(l.patient_name)}</h3>
                    <p className="text-xs text-slate-400">
                      {l.to_user_name ? `ارجاع به: ${l.to_user_name} (داخلی)` : `ارجاع به: ${toPersianDigits(l.to_doctor)}`}
                      {l.to_doctor && l.to_user_name ? ` | خارجی: ${toPersianDigits(l.to_doctor)}` : ''}
                      {' | '}تاریخ: {toJalali(l.date)}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">{toPersianDigits(l.description)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePrint(l.id)} className="action-btn primary" title="چاپ"><Printer size={14} /></button>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[l.status] || 'bg-slate-100 text-slate-600'}`}>
                    {statusLabels[l.status] || l.status}
                  </span>
                  {hasRole('admin') && (
                    <button onClick={() => handleDelete(l.id)} className="action-btn danger"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
                  <FileText size={18} className="text-brand-600" />
                </div>
                <h3 className="text-base font-bold text-slate-800">ارجاع جدید</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
                  <button type="button" onClick={() => setInternalMode(false)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!internalMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                    ارجاع خارجی
                  </button>
                  <button type="button" onClick={() => setInternalMode(true)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${internalMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                    ارجاع داخلی
                  </button>
                </div>
                <div>
                  <label className="label">بیمار <span className="text-red-500">*</span></label>
                  <input className="input-field" placeholder="جستجوی بیمار..." value={searchTerm} onChange={e => handleSearchPatient(e.target.value)} required />
                  {patients.length > 0 && (
                    <div className="border border-slate-200 rounded-xl mt-1 max-h-32 overflow-y-auto">
                      {patients.map(p => (
                        <div key={p.id} className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm text-slate-700" onClick={() => selectPatient(p)}>
                          {p.first_name} {p.last_name} - {p.national_id}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {internalMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="label">کاربر مقصد <span className="text-red-500">*</span></label>
                      <select className="input-field" value={form.to_user} onChange={e => {
                        const selectedUser = users.find(u => u.id === Number(e.target.value))
                        setForm({ ...form, to_user: e.target.value, to_user_name: selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : '' })
                        setSupportTarget(selectedUser?.role === 'support')
                      }} required>
                        <option value="">انتخاب کاربر...</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                        ))}
                      </select>
                      {supportTarget && (
                        <p className="text-xs text-amber-600 mt-1">این کاربر پشتیبانی است. پیام در صندوق پشتیبانی ثبت می‌شود.</p>
                      )}
                    </div>
                    <div><label className="label">تاریخ ارجاع <span className="text-red-500">*</span></label>
                      <JalaliDateInput value={form.date} onChange={(v: string) => setForm({ ...form, date: v })} required />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className="label">پزشک/مرکز مقصد <span className="text-red-500">*</span></label>
                        <input className="input-field" value={form.to_doctor} onChange={e => setForm({ ...form, to_doctor: e.target.value })} required placeholder="نام پزشک یا مرکز" />
                      </div>
                      <div><label className="label">تاریخ ارجاع <span className="text-red-500">*</span></label>
                        <JalaliDateInput value={form.date} onChange={(v: string) => setForm({ ...form, date: v })} required />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="alsoInternal" checked={alsoInternal}
                        onChange={e => { setAlsoInternal(e.target.checked); if (!e.target.checked) setForm(prev => ({ ...prev, to_user: '' })) }}
                        className="rounded border-slate-300" />
                      <label htmlFor="alsoInternal" className="text-sm text-slate-700">برای کاربر داخلی هم ارسال شود</label>
                    </div>
                    {alsoInternal && (
                      <div><label className="label">کاربر مقصد (داخلی)</label>
                        <select className="input-field" value={form.to_user} onChange={e => setForm({ ...form, to_user: e.target.value })}>
                          <option value="">انتخاب کاربر...</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.role})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
                <div><label className="label">شرح ارجاع <span className="text-red-500">*</span></label>
                  <textarea className="input-field" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="شرح علت ارجاع..." />
                </div>
                <div>
                  <label className="label">فایل ضمیمه</label>
                  <input type="file" className="input-field" onChange={e => setForm({ ...form, file: e.target.files ? e.target.files[0] : null })} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                  {form.file && <p className="text-xs text-green-600 mt-1"><Paperclip size={12} className="inline ml-1" />{form.file.name}</p>}
                </div>
                <button type="submit" className="btn-primary w-full">ثبت و چاپ نامه</button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {printData && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
                  <FileText size={18} className="text-brand-600" />
                </div>
                <h3 className="text-base font-bold text-slate-800">پیش‌نمایش نامه ارجاع</h3>
              </div>
              <button onClick={() => setPrintData(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6" ref={printRef}>
              <div className="ref-top flex items-baseline justify-between pb-3 mb-4 border-b border-slate-200">
                <div className="from text-sm font-bold text-[#1e3a5f]">{clinicSettings?.clinic_name || 'کلینیک اعصاب و روان دکتر محمد طاهری'}</div>
                <div className="date-line text-[10px] text-slate-400"><span className="text-slate-300">تاریخ:</span><span className="text-slate-700 font-bold mr-1"> {toJalali(printData.date)}</span></div>
              </div>
              <div className="ref-to text-xs text-slate-600 mb-4 p-3 bg-slate-50 border border-slate-200">
                {printData.to_doctor && (
                  <><span className="text-slate-400">به پزشک متخصص / فوق تخصص</span>
                  <span className="text-slate-700 font-bold mr-1"> {toPersianDigits(printData.to_doctor)}</span></>
                )}
                {printData.to_user_name && (
                  <><span className="text-slate-400 mr-2">| کاربر داخلی:</span>
                  <span className="text-slate-700 font-bold mr-1"> {printData.to_user_name}</span></>
                )}
              </div>
              <div className="ref-body text-xs text-slate-600 leading-8 my-4 text-justify" style={{ whiteSpace: 'pre-line' as const }}>
                {toPersianDigits(printData.description)}
              </div>
              <div className="ref-sig text-center mt-6 pt-3 border-t border-dashed border-slate-200">
                <div className="sig-label text-[10px] text-slate-400">نام و نام خانوادگی مدیر کلینیک</div>
                <div className="sig-name text-xs font-bold text-slate-700 mb-1">{toPersianDigits(printData.from_doctor_name)}</div>
                {printData.from_doctor_signature ? (
                  <img src={printData.from_doctor_signature} alt="امضا" className="sig-img max-h-[40px] max-w-[120px] object-contain" />
                ) : (
                  <div className="sig-stamp" style={{ borderBottom: '1px solid #cbd5e1', width: 100, marginBottom: 4 }} />
                )}
                <div className="sig-stamp text-[9px] text-slate-400">مهر و امضاء</div>
              </div>
              <div className="feedback-wrap mt-8 pt-5 border-t border-[#1e3a5f]">
                <div className="feedback-title text-sm font-bold text-[#1e3a5f] mb-4 text-center">بازخورد</div>
                <textarea className="input-field" rows={12} value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)} style={{ fontSize: 12, lineHeight: 2.2 }} />
                <div className="feedback-sig text-center mt-6 pt-3 border-t border-dashed border-slate-200">
                  <div className="sig-label text-[10px] text-slate-400">نام و نام خانوادگی پزشک متخصص / فوق تخصص</div>
                  <div style={{ height: 40, borderBottom: '1px solid #cbd5e1', width: 100, marginBottom: 4 }} />
                  <div className="sig-stamp text-[9px] text-slate-400">مهر و امضاء</div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex gap-3 justify-center">
              <button onClick={doPrint} className="btn-primary flex items-center gap-2"><Printer size={16} /> چاپ نامه</button>
              <button onClick={() => setPrintData(null)} className="btn-secondary">بستن</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
