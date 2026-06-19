import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Database, Download, Upload, Clock, Save, RefreshCw } from 'lucide-react'
import { createBackup, getBackupLogs, getBackupSchedule, updateBackupSchedule, downloadBackup, restoreBackup } from '../../services/api'
import { toJalali } from '../../utils/jalali'
import Button from '../Button'

interface BackupLogItem {
  id?: number
  filename: string
  size_bytes: number
  status: string
  cloud_uploaded?: boolean
  error_message?: string
  checksum?: string
  created_at: string
}

export default function BackupSection() {
  const [backupEnabled, setBackupEnabled] = useState(false)
  const [backupHour, setBackupHour] = useState(3)
  const [backupMinute, setBackupMinute] = useState(0)
  const [backupRetention, setBackupRetention] = useState(30)
  const [encryptBackup, setEncryptBackup] = useState(true)
  const [backupHistory, setBackupHistory] = useState<BackupLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [scheduleRes, logsRes] = await Promise.all([
        getBackupSchedule(),
        getBackupLogs(),
      ])
      const sched = scheduleRes.data
      setBackupEnabled(sched.enabled)
      setBackupHour(sched.hour)
      setBackupMinute(sched.minute)
      setBackupRetention(sched.retention_days)
      setEncryptBackup(sched.encrypt_backup ?? true)
      setBackupHistory(Array.isArray(logsRes.data) ? logsRes.data : [])
    } catch {
      setBackupHistory([])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const saveBackupSettings = async () => {
    setSaving(true)
    try {
      await updateBackupSchedule({
        hour: backupHour,
        minute: backupMinute,
        retention_days: backupRetention,
        encrypt_backup: encryptBackup,
      })
      toast.success('تنظیمات پشتیبان با موفقیت ذخیره شد')
      fetchData()
    } catch { toast.error('خطا در ذخیره تنظیمات پشتیبان') }
    finally { setSaving(false) }
  }

  const handleManualBackup = async () => {
    setCreating(true)
    try {
      await createBackup()
      toast.success('پشتیبان‌گیری با موفقیت انجام شد')
      fetchData()
    } catch { toast.error('خطا در پشتیبان‌گیری') }
    finally { setCreating(false) }
  }

  const handleRestore = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip,.db,.sqlite,.sqlite3,.json'
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (!window.confirm('بازیابی اطلاعات، اطلاعات فعلی را کاملاً بازنویسی می‌کند. ادامه می‌دهید؟')) return
      const fd = new FormData()
      fd.append('file', file)
      try {
        await restoreBackup(fd)
        toast.success('بازیابی اطلاعات با موفقیت انجام شد')
        fetchData()
      } catch { toast.error('خطا در بازیابی اطلاعات') }
    }
    input.click()
  }

  const handleDownloadLog = async (filename: string) => {
    try {
      const { data } = await downloadBackup(filename)
      const url = window.URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
    } catch { toast.error('خطا در دانلود فایل') }
  }

  return (
    <>
      <div className="panel card-iranian">
        <div className="panel-header panel-header-iranian">
          <h3 className="flex items-center gap-2"><Database size={18} className="text-brand-500" /> پشتیبان‌گیری خودکار</h3>
        </div>
        <div className="panel-body space-y-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="backupEnabled" checked={backupEnabled} onChange={e => setBackupEnabled(e.target.checked)} />
            <label htmlFor="backupEnabled" className="text-sm">فعال‌سازی پشتیبان‌گیری خودکار</label>
          </div>
          <div className="form-grid">
            <div>
              <label className="label">ساعت</label>
              <input className="input-field" type="number" min={0} max={23} value={backupHour}
                onChange={e => setBackupHour(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">دقیقه</label>
              <input className="input-field" type="number" min={0} max={59} value={backupMinute}
                onChange={e => setBackupMinute(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">نگهداری (روز)</label>
              <input className="input-field" type="number" min={1} max={365} value={backupRetention}
                onChange={e => setBackupRetention(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">رمزنگاری بکاپ</label>
              <select className="input-field" value={encryptBackup ? '1' : '0'}
                onChange={e => setEncryptBackup(e.target.value === '1')}>
                <option value="1">فعال</option>
                <option value="0">غیرفعال</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={saveBackupSettings} disabled={saving} icon={Save}>{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</Button>
            <Button variant="secondary" icon={Download} onClick={handleManualBackup} disabled={creating}>
              {creating ? 'در حال پشتیبان‌گیری...' : 'پشتیبان‌گیری دستی'}
            </Button>
            <Button variant="danger" icon={Upload} onClick={handleRestore}>بازیابی از فایل</Button>
          </div>
        </div>
      </div>

      <div className="panel card-iranian">
        <div className="panel-header panel-header-iranian">
          <h3 className="flex items-center gap-2"><Clock size={18} className="text-brand-500" /> تاریخچه پشتیبان‌ها</h3>
          <Button size="xs" variant="ghost" onClick={fetchData}><RefreshCw size={14} /></Button>
        </div>
        <div className="panel-body">
          {loading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" /></div>
          ) : backupHistory.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Database size={40} className="mx-auto mb-2 opacity-30" />
              <p>هنوز پشتیبان‌گیری انجام نشده</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr><th className="text-right p-2">نام فایل</th><th className="text-right p-2">تاریخ</th><th className="text-right p-2">وضعیت</th><th className="text-left p-2">دانلود</th></tr>
                </thead>
                <tbody>
                  {backupHistory.map((b, idx) => (
                    <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="p-2 text-xs font-mono">{b.filename}</td>
                      <td className="p-2 text-xs">{b.created_at ? new Date(b.created_at).toLocaleDateString('fa-IR') : '—'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${b.status === 'success' ? 'bg-green-100 text-green-700' : b.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {b.status === 'success' ? 'موفق' : b.status === 'failed' ? 'ناموفق' : b.status}
                        </span>
                      </td>
                      <td className="p-2 text-left">
                        <Button size="xs" variant="ghost" onClick={() => handleDownloadLog(b.filename)}>
                          <Download size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
