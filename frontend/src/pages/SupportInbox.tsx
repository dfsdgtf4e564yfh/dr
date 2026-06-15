import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { createPortal } from 'react-dom'
import { MessageSquare, Send, CheckCircle, Clock, Plus, X, Search, Paperclip, Download, FileText } from 'lucide-react'
import { getSupportMessages, createSupportMessage, replySupportMessage, searchPatients, downloadSupportAttachment } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { toJalali, toPersianDigits } from '../utils/jalali'

const statusLabels: Record<string, string> = { pending: 'در انتظار پاسخ', answered: 'پاسخ داده شده' }
const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', answered: 'bg-green-100 text-green-700' }

export default function SupportInbox() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [replying, setReplying] = useState<any>(null)
  const [replyText, setReplyText] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [patientSearch, setPatientSearch] = useState<string>('')
  const [patientResults, setPatientResults] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState({ patient: '', patient_name: '', subject: '', message: '', attachment: null as File | null })
  const [attachmentName, setAttachmentName] = useState<string>('')
  const { user } = useAuth()

  useEffect(() => { loadMessages() }, [])

  const loadMessages = async () => {
    try { const res = await getSupportMessages(); const d = res.data as any; setMessages(d.results || d) }
    catch (err: any) { toast.error('خطا در دریافت پیام‌ها') }
    finally { setLoading(false) }
  }

  const searchForPatient = async (q: string) => {
    setPatientSearch(q)
    if (q.length < 2) { setPatientResults([]); return }
    try {
      const res = await searchPatients(q)
      const data = res.data as any
      setPatientResults(data.results || data || [])
    } catch (err: any) { setPatientResults([]) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSupportMessage(newMessage as any)
      toast.success('پیام شما با موفقیت ارسال شد ')
      setShowModal(false)
      setNewMessage({ patient: '', patient_name: '', subject: '', message: '', attachment: null })
      setAttachmentName('')
      loadMessages()
    } catch (err: any) { toast.error('خطا در ارسال پیام') }
  }

  const handleReply = async (id: number) => {
    if (!replyText.trim()) return
    try {
      await replySupportMessage(id, replyText)
      toast.success('پاسخ شما با موفقیت ارسال شد ')
      setReplying(null); setReplyText('')
      loadMessages()
    } catch (err: any) { toast.error('خطا در ارسال پاسخ') }
  }

  const handleDownload = async (id: number, filename: string) => {
    try {
      const res = await downloadSupportAttachment(id)
      const blob = new Blob([res.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) { toast.error('خطا در دانلود فایل') }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      setNewMessage({ ...newMessage, attachment: file })
      setAttachmentName(file.name)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" /></div>
  )

  const filtered = messages.filter(m =>
    !searchTerm || m.subject?.includes(searchTerm) || m.patient_name?.includes(searchTerm) || m.message?.includes(searchTerm)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-800">صندوق پیام‌ها</h1>
          <p className="text-sm text-surface-400 mt-1">مدیریت پیام‌های پشتیبانی و داخلی</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> پیام جدید</button>
      </div>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input className="input-field pr-9" placeholder="جستجوی پیام..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="panel py-16 text-center"><MessageSquare size={40} className="text-surface-300 mx-auto mb-3" /><p className="text-surface-400">پیامی یافت نشد</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <div key={m.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-surface-800">{m.subject}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[m.status] || 'bg-surface-100 text-surface-500'}`}>{statusLabels[m.status] || m.status}</span>
                  </div>
                  <p className="text-xs text-surface-400 mt-1.5">
                    {m.patient_name && <span>بیمار: {m.patient_name} — </span>}
                    {m.sender_name && <span>فرستنده: {m.sender_name} — </span>}
                    {m.created_at && <span>{toJalali(m.created_at.split('T')[0])}</span>}
                  </p>
                  <p className="text-sm text-surface-600 mt-3 leading-relaxed whitespace-pre-line">{m.message}</p>
                  {m.attachment_url && (
                    <div className="mt-3 inline-flex">
                      <button
                        onClick={() => handleDownload(m.id, m.attachment_name || 'فایل ضمیمه')}
                        className="inline-flex items-center gap-2 text-xs bg-surface-100 hover:bg-brand-50 text-surface-600 hover:text-brand-600 border border-surface-200 hover:border-brand-200 rounded-xl px-3 py-1.5 transition-all"
                      >
                        <FileText size={14} />
                        <span className="truncate max-w-[200px]">{m.attachment_name || 'فایل ضمیمه'}</span>
                        <Download size={14} />
                      </button>
                    </div>
                  )}
                  {m.answer && (
                    <div className="mt-3 mr-4 pr-3 border-r-2 border-brand-200 bg-brand-50/30 rounded-lg p-3">
                      <p className="text-xs font-bold text-brand-600 mb-1">پاسخ:</p>
                      <p className="text-sm text-surface-600">{m.answer}</p>
                    </div>
                  )}
                </div>
                {m.status === 'pending' && user?.role === 'support' && (
                  <button onClick={() => setReplying(replying === m.id ? null : m.id)} className="btn-outline text-xs shrink-0">
                    {replying === m.id ? 'لغو' : 'پاسخ'}
                  </button>
                )}
              </div>
              {replying === m.id && (
                <div className="mt-4 pt-4 border-t border-surface-100">
                  <textarea className="input-field min-h-[80px]" placeholder="متن پاسخ..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                  <button onClick={() => handleReply(m.id)} className="btn-primary mt-2 flex items-center gap-2 text-sm"><Send size={14} /> ارسال پاسخ</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-surface-800">پیام جدید</h3>
              <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-surface-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="relative">
                <label className="label">بیمار</label>
                <input className="input-field" placeholder="جستجوی بیمار..." value={patientSearch} onChange={e => searchForPatient(e.target.value)} />
                {patientResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-surface-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {patientResults.map(p => (
                      <div key={p.id} className="px-4 py-2.5 hover:bg-brand-50 cursor-pointer text-sm text-surface-700 border-b border-surface-50 last:border-0"
                        onClick={() => { setNewMessage({ ...newMessage, patient: p.id, patient_name: `${p.first_name} ${p.last_name}` }); setPatientSearch(`${p.first_name} ${p.last_name}`); setPatientResults([]) }}>
                        {p.first_name} {p.last_name} — {p.national_id}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div><label className="label">موضوع</label><input className="input-field" value={newMessage.subject} onChange={e => setNewMessage({ ...newMessage, subject: e.target.value })} required /></div>
              <div><label className="label">متن پیام</label><textarea className="input-field min-h-[120px]" value={newMessage.message} onChange={e => setNewMessage({ ...newMessage, message: e.target.value })} required /></div>
              <div>
                <label className="label">فایل ضمیمه</label>
                <div className="relative">
                  <input
                    type="file"
                    id="support-attachment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="support-attachment"
                    className="flex items-center gap-2 w-full cursor-pointer border-2 border-dashed border-surface-200 rounded-xl px-4 py-3 text-sm text-surface-500 hover:border-brand-300 hover:bg-brand-50/30 transition-all"
                  >
                    <Paperclip size={18} className="text-surface-400" />
                    {attachmentName ? (
                      <span className="text-surface-700 font-medium truncate">{attachmentName}</span>
                    ) : (
                      <span>انتخاب فایل (اختیاری)</span>
                    )}
                  </label>
                  {attachmentName && (
                    <button
                      type="button"
                      onClick={() => { setNewMessage({ ...newMessage, attachment: null }); setAttachmentName('') }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-rose-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2"><Send size={16} /> ارسال پیام</button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
