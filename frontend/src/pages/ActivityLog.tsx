import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { History, Activity, User, Trash2, RefreshCw, RotateCcw, XCircle, CheckCircle, Calendar, Settings, MessageSquare } from 'lucide-react'
import { getAuditLogs } from '../services/api'
import { toJalali, toPersianDigits } from '../utils/jalali'
import { SkeletonTable } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import JalaliDateInput from '../components/JalaliDateInput'
import { SectionDivider, KhatamBorder } from '../components/PersianDecoration'

const activityIcons: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  created: { icon: Activity, color: 'text-success-500', bg: 'bg-success-50' },
  updated: { icon: RefreshCw, color: 'text-brand-500', bg: 'bg-brand-50' },
  deleted: { icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-50' },
  viewed: { icon: Activity, color: 'text-info-500', bg: 'bg-info-50' },
  login: { icon: User, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  restore: { icon: RotateCcw, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  permanent_delete: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  cancel: { icon: XCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
  complete: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  reschedule: { icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
  reply: { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-50' },
}

const activityLabels: Record<string, string> = {
  created: 'ایجاد',
  updated: 'ویرایش',
  deleted: 'حذف',
  viewed: 'مشاهده',
  login: 'ورود',
  restore: 'بازیابی',
  permanent_delete: 'حذف دائمی',
  cancel: 'لغو',
  complete: 'تکمیل',
  reschedule: 'تغییر زمان',
  reply: 'پاسخ',
}

const modelLabels: Record<string, string> = {
  Patient: 'بیمار',
  Appointment: 'نوبت',
  Billing: 'صورتحساب',
  MedicalRecord: 'پرونده پزشکی',
  User: 'کاربر',
  ClinicSetting: 'تنظیمات',
  SupportMessage: 'پشتیبانی',
}

const systemModels = ['User', 'ClinicSetting', 'SupportMessage']

export default function ActivityLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [systemOnly, setSystemOnly] = useState<boolean>(true)
  const [filters, setFilters] = useState<{ action: string; model: string; date_from: string; date_to: string }>({ action: '', model: '', date_from: '', date_to: '' })

  const load = async () => {
    setLoading(true)
    try {
      const params: any = { page: 1 }
      if (filters.action) params.action = filters.action
      if (filters.model) params.model = filters.model
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (systemOnly && !filters.model) {
        params.model__in = systemModels.join(',')
      }
      const response = await getAuditLogs(params)
      const data = response.data
      setLogs(data.results || data)
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'خطا در دریافت تاریخچه فعالیت‌ها'
      toast.error(message)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters, systemOnly])

  const handleRefresh = () => { load() }

  return (
    <div className="space-y-5">
      <PageHeader title="لاگ‌ها" icon={History}>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setSystemOnly(!systemOnly)}
            className={`btn btn-sm flex items-center gap-1.5 ${systemOnly ? 'btn-gradient' : 'btn-secondary'}`}
          >
            {systemOnly ? 'سیستمی' : 'همه'} <Activity size={14} />
          </button>
          <button onClick={handleRefresh} className="btn btn-secondary btn-sm flex items-center gap-1.5">
            <RefreshCw size={14} /> بروزرسانی
          </button>
        </div>
      </PageHeader>

      <div className="panel card-iranian">
        <div className="panel-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select className="input-field" value={filters.action} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, action: e.target.value })}>
              <option value="">همه اقدامات</option>
              <option value="login">ورود به سیستم</option>
              <option value="created">ایجاد</option>
              <option value="updated">ویرایش</option>
              <option value="deleted">حذف</option>
              <option value="reply">پاسخ</option>
              <option value="restore">بازیابی</option>
              <option value="cancel">لغو</option>
              <option value="complete">تکمیل</option>
              <option value="reschedule">تغییر زمان</option>
            </select>
            <select className="input-field" value={filters.model} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, model: e.target.value })}>
              <option value="">همه مدل‌ها</option>
              <option value="User">ورود به سیستم</option>
              <option value="ClinicSetting">تنظیمات</option>
              <option value="SupportMessage">پشتیبانی</option>
              <option value="Patient">بیمار</option>
              <option value="Appointment">نوبت</option>
              <option value="Billing">صورتحساب</option>
              <option value="MedicalRecord">پرونده پزشکی</option>
            </select>
            <JalaliDateInput value={filters.date_from} onChange={(v: string) => setFilters({ ...filters, date_from: v })} />
            <JalaliDateInput value={filters.date_to} onChange={(v: string) => setFilters({ ...filters, date_to: v })} />
          </div>
        </div>
      </div>

      <SectionDivider />

      {loading ? (
        <div className="panel card-iranian"><SkeletonTable rows={8} cols={5} /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon={History} title="فعالیتی یافت نشد" description="هیچ فعالیتی با فیلترهای فعلی وجود ندارد." />
      ) : (
        <div className="space-y-2">
          {logs.map((log: any, i: number) => {
            const meta = activityIcons[log.action] || activityIcons.viewed
            const MetaIcon = meta.icon
            return (
              <div key={log.id || i} className="card p-4 flex items-start gap-4 hover:border-brand-200/60 transition-all">
                <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                  <MetaIcon size={18} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-surface-800">{log.user_name || 'سیستم'}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${meta.bg} ${meta.color}`}>
                      {activityLabels[log.action] || log.action}
                    </span>
                    {log.model && (
                      <span className="text-[11px] text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
                        {modelLabels[log.model] || log.model}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-surface-500 mt-1">{log.description || log.message || 'بدون توضیحات'}</p>
                  {log.details && (
                    <pre className="text-[10px] text-surface-400 mt-1 bg-surface-50 rounded-lg p-2 overflow-x-auto max-h-20">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
                <div className="text-[11px] text-surface-400 shrink-0 whitespace-nowrap">
                  {toJalali(log.created_at)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <KhatamBorder />
    </div>
  )
}
