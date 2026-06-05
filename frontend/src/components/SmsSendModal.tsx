import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, MessageSquare, Phone, Send, Loader2, Check, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getSmsConfirmPreview, getSmsReminderPreview, getSmsPaymentPreview,
  sendSmsConfirm, sendSmsReminder, sendSmsPayment,
  getSmsMethodInfo
} from '../services/api'

interface SmsSendModalProps {
  show: boolean
  onClose: () => void
  type: 'confirm' | 'reminder' | 'payment'
  appointmentId?: number
  patientId?: number
  amount?: number
  onSuccess?: () => void
  billingAppointmentId?: number
}

const SMS_TYPES: Record<string, { label: string; getPreview: any; send: any }> = {
  confirm: { label: 'تأیید نوبت', getPreview: getSmsConfirmPreview, send: sendSmsConfirm },
  reminder: { label: 'یادآوری نوبت', getPreview: getSmsReminderPreview, send: sendSmsReminder },
  payment: { label: 'یادآوری پرداخت', getPreview: getSmsPaymentPreview, send: sendSmsPayment },
}

export default function SmsSendModal({ show, onClose, type, appointmentId, patientId, amount, onSuccess, billingAppointmentId }: SmsSendModalProps) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [methodInfo, setMethodInfo] = useState<any>(null)
  const [messageText, setMessageText] = useState('')
  const [error, setError] = useState('')

  const smsType = SMS_TYPES[type]

  const loadPreview = useCallback(async () => {
    setLoading(true)
    try {
      let previewRes, methodRes

      if (type === 'payment') {
        previewRes = await smsType.getPreview(patientId, amount, billingAppointmentId)
      } else {
        previewRes = await smsType.getPreview(appointmentId)
      }

      try {
        methodRes = await getSmsMethodInfo(type)
        setMethodInfo(methodRes.data)
      } catch {}

      if (previewRes.data) {
        setPreviewData(previewRes.data)
        setMessageText(previewRes.data.message || previewRes.data.preview || '')
      } else {
        setError('خطا در بارگذاری پیش‌نمایش')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در بارگذاری')
    } finally {
      setLoading(false)
    }
  }, [type, appointmentId, patientId, amount, smsType, billingAppointmentId])

  useEffect(() => {
    if (show) {
      setPreviewData(null)
      setMethodInfo(null)
      setMessageText('')
      setError('')
      loadPreview()
    }
  }, [show, loadPreview])

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [show])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSend = async () => {
    setError('')
    setSending(true)
    try {
      let res
      const usePattern = methodInfo?.method === 'pattern'

      const msgText = isPatternMethod ? null : messageText

      if (type === 'payment') {
        res = await smsType.send(patientId, amount, msgText, null, usePattern || null, billingAppointmentId)
      } else {
        res = await smsType.send(appointmentId, msgText, null, null, usePattern || null)
      }

      if (res.data?.success) {
        toast.success('پیامک با موفقیت ارسال شد ')
        onClose()
        if (onSuccess) onSuccess()
      } else {
        setError(res.data?.message || 'خطا در ارسال پیامک')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'خطا در ارسال')
    } finally {
      setSending(false)
    }
  }

  const isPatternMethod = methodInfo?.method === 'pattern'
  const hasActiveTemplate = methodInfo?.template !== null

  if (!show) return null

  return createPortal(
    <div
      className="fixed inset-0 bg-black/30 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-brand-500" size={22} />
            <h3 className="text-lg font-bold text-slate-800">ارسال پیامک — {smsType.label}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-brand-500" size={32} />
          </div>
        ) : previewData ? (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-slate-400" />
                <span className="text-slate-500">گیرنده:</span>
                <span className="font-bold text-slate-800">{previewData.patient_name}</span>
                <span className="text-slate-400">—</span>
                <span className="font-bold text-slate-700" dir="ltr">{previewData.phone}</span>
              </div>
            </div>

            <div className={`rounded-xl p-4 border-2 ${
              isPatternMethod && hasActiveTemplate
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isPatternMethod && hasActiveTemplate ? (
                  <Check className="text-green-600" size={18} />
                ) : (
                  <AlertCircle className="text-amber-600" size={18} />
                )}
                <span className={`font-bold text-sm ${
                  isPatternMethod && hasActiveTemplate ? 'text-green-800' : 'text-amber-800'
                }`}>
                  روش ارسال: {isPatternMethod && hasActiveTemplate ? 'الگو (Pattern) — اولویت بالا' : 'متن آزاد (SendSimple)'}
                </span>
              </div>
              {isPatternMethod && hasActiveTemplate ? (
                <div className="text-xs text-green-700 space-y-1">
                  <p>✓ الگوی فعال: <span className="font-bold">{methodInfo.template.name}</span> (bodyId: {methodInfo.template.pattern_code})</p>
                  <p>✓ پیامک با خطوط خدماتی ارسال می‌شود و احتمال دریافت بالاتر است</p>
                  <p>✓ پارامترها (args) به ترتیب در الگو جایگزین می‌شوند</p>
                </div>
              ) : (
                <div className="text-xs text-amber-700 space-y-1">
                  <p>• الگوی فعال برای این نوع پیامک تنظیم نشده است</p>
                  <p>• برای استفاده از روش الگو، ابتدا در پنل ملی پیامک الگو بسازید و bodyId آن را در تنظیمات → الگوهای پیامک ثبت کنید</p>
                  <p>• در این حالت می‌توانید متن پیامک را شخصی‌سازی کنید</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <label className="label mb-2">
                {isPatternMethod && hasActiveTemplate ? 'پیش‌نمایش متن ارسالی' : 'متن پیامک (قابل ویرایش)'}
              </label>
              <textarea
                className="input-field w-full"
                rows={4}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                disabled={isPatternMethod && hasActiveTemplate}
              />
            </div>

            {isPatternMethod && hasActiveTemplate && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="label mb-2">پیش‌نمایش پارامترهای الگو:</p>
                <div className="text-xs text-slate-600 space-y-1 font-mono">
                  {type !== 'payment' ? (
                    <>
                      <p><span className="text-brand-600 font-bold">#PATIENTNAME#</span> → {previewData.patient_name}</p>
                      <p><span className="text-brand-600 font-bold">#DATE#</span> → (تاریخ نوبت)</p>
                      <p><span className="text-brand-600 font-bold">#TIME#</span> → (ساعت نوبت)</p>
                      <p><span className="text-brand-600 font-bold">#DOCTORNAME#</span> → (نام پزشک)</p>
                    </>
                  ) : (
                    <>
                      <p><span className="text-brand-600 font-bold">#PATIENTNAME#</span> → {previewData.patient_name}</p>
                      <p><span className="text-brand-600 font-bold">#AMOUNT#</span> → {amount} تومان</p>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  این مقادیر با جداکننده ## ترکیب شده و در الگوی تعریف شده در پنل ملی پیامک جایگزین می‌شوند.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <><Loader2 className="animate-spin" size={16} /> در حال ارسال...</>
                ) : (
                  <><Send size={16} /> ارسال پیامک</>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  )
}
