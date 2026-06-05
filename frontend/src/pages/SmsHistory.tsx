import React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-toastify'
import { MessageSquare, Search, Filter, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getSmsLogs, checkPendingDeliveries } from '../services/api'
import { toPersianDigits } from '../utils/jalali'

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  confirm: 'تأیید نوبت',
  reminder: 'یادآوری نوبت',
  payment: 'یادآوری پرداخت',
  otp: 'کد تایید',
}

const METHOD_LABELS: Record<string, string> = {
  bulk: 'متن آزاد',
  pattern: 'الگو',
}

const STATUS_CONFIG: Record<string, any> = {
  sent: { label: 'ارسال شد', badge: 'active', icon: CheckCircle, color: 'text-green-600' },
  failed: { label: 'خطا', badge: 'inactive', icon: XCircle, color: 'text-red-600' },
  pending: { label: 'در انتظار تایید', badge: 'pending', icon: Clock, color: 'text-amber-600' },
}

export default function SmsHistory() {
  const { hasRole } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [hasPending, setHasPending] = useState<boolean>(false)
  const timerRef = useRef<any>(null)
  const [filters, setFilters] = useState<any>({
    message_type: '',
    status: '',
    phone: '',
  })
  const pageSize = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page }
      if (filters.message_type) params.message_type = filters.message_type
      if (filters.status) params.status = filters.status
      if (filters.phone) params.phone = filters.phone

      const res = await getSmsLogs(params)
      const data = res.data as any
      const items = data.results || data
      setLogs(items)
      setTotalCount(data.count || (Array.isArray(data) ? data.length : 0))
      setTotalPages(data.count ? Math.ceil(data.count / pageSize) : 1)
      setHasPending(items.some((l: any) => l.status === 'pending'))
    } catch {
      toast.error('متأسفانه در دریافت تاریخچه پیامک‌ها خطایی رخ داد ')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (hasPending) {
      checkPendingDeliveries().catch(() => {})
      timerRef.current = setInterval(async () => {
        try {
          await checkPendingDeliveries()
          load()
        } catch {}
      }, 30000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [hasPending, load])

  const handleFilterChange = (key: string, value: string) => {
    setPage(1)
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getStatusInfo = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString('fa-IR')
    } catch {
      return dateStr
    }
  }

  if (!hasRole('admin', 'reception', 'doctor', 'support')) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">دسترسی به این صفحه امکان‌پذیر نیست.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-extrabold text-slate-800">تاریخچه پیامک‌ها</h1>
        <div className="flex gap-2">
          {hasPending && (
            <span className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
              <Clock size={12} /> در حال بررسی خودکار...
            </span>
          )}
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> بروزرسانی
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="label flex items-center gap-1 text-xs"><Filter size={12} /> نوع پیام</label>
              <select
                className="input-field text-sm"
                value={filters.message_type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('message_type', e.target.value)}
              >
                <option value="">همه انواع</option>
                <option value="confirm">تأیید نوبت</option>
                <option value="reminder">یادآوری نوبت</option>
                <option value="payment">یادآوری پرداخت</option>
                <option value="otp">کد تایید</option>
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1 text-xs"><Filter size={12} /> وضعیت</label>
              <select
                className="input-field text-sm"
                value={filters.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('status', e.target.value)}
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="sent">ارسال شد</option>
                <option value="failed">خطا</option>
                <option value="pending">در انتظار تایید</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="label flex items-center gap-1 text-xs"><Search size={12} /> جستجوی شماره</label>
              <input
                type="text"
                className="input-field text-sm"
                placeholder="شماره موبایل..."
                value={filters.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('phone', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
              <p>هنوز پیامکی ارسال نشده است</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">تاریخ</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">گیرنده</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">شماره</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">نوع</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">متن</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">روش</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">ارسال‌کننده</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">IP</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">وضعیت</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">شناسه</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const statusInfo = getStatusInfo(log.status)
                    const StatusIcon = statusInfo.icon
                    return (
                      <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                          {log.message_type === 'otp' ? (log.sent_by_username || 'سیستم') : (log.patient_name || '—')}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono" dir="ltr">{log.phone_number}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{MESSAGE_TYPE_LABELS[log.message_type] || log.message_type}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate" title={log.message_text}>{log.message_text || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${log.send_method === 'pattern' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {METHOD_LABELS[log.send_method] || log.send_method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{log.sent_by_username || '—'}</td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-400" dir="ltr">{log.ip_address || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon size={14} className={statusInfo.color} />
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              statusInfo.badge === 'active' ? 'bg-green-100 text-green-700' :
                              statusInfo.badge === 'inactive' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.message_id ? (
                            <span className="text-xs font-mono text-slate-400" dir="ltr">{log.message_id}</span>
                          ) : log.template_id ? (
                            <span className="text-xs font-mono text-slate-400">{log.template_id}</span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {toPersianDigits(String(totalCount))} پیامک (صفحه {toPersianDigits(String(page))} از {toPersianDigits(String(totalPages))})
              </span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:border-brand-500 hover:text-brand-500 disabled:opacity-30 transition-colors">
                  <ChevronRight size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        p === page ? 'bg-brand-500 text-white shadow-sm' : 'border border-slate-200 text-slate-500 hover:border-brand-500 hover:text-brand-500'
                      }`}>
                      {toPersianDigits(String(p))}
                    </button>
                  )
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:border-brand-500 hover:text-brand-500 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
