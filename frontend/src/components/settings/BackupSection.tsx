import { useState } from 'react'
import { toast } from 'react-toastify'
import { Database, Download, Upload, Clock, Save } from 'lucide-react'
import api from '../../services/api'
import Button from '../Button'

interface BackupHistoryItem {
  id: number
  created_at: string
  type: string
  status: string
  file?: string
}

export default function BackupSection() {
  const [backupEnabled, setBackupEnabled] = useState(false)
  const [backupSchedule, setBackupSchedule] = useState('daily')
  const [backupTime, setBackupTime] = useState('02:00')
  const [backupRetention, setBackupRetention] = useState(7)
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([])

  const fetchBackupHistory = async () => {
    try {
      const { data } = await api.get('/auth/backup-history/')
      setBackupHistory(Array.isArray(data) ? data : (data as any).results || [])
    } catch { setBackupHistory([]) }
  }

  const saveBackupSettings = async () => {
    try {
      const { data } = await api.patch('/auth/backup-settings/', {
        enabled: backupEnabled,
        schedule: backupSchedule,
        time: backupTime,
        retention_days: backupRetention,
      })
      if (data) toast.success('تنظیمات پشتیبان با موفقیت ذخیره شد ')
    } catch { toast.error('متأسفانه در ذخیره تنظیمات خطایی رخ داد ') }
  }

  const manualBackup = async () => {
    try {
      const { data } = await api.post('/auth/backup/', {})
      if ((data as any)?.file) {
        const link = document.createElement('a')
        link.href = (data as any).file
        link.download = (data as any).filename || 'backup.zip'
        link.click()
        toast.success('فایل پشتیبان با موفقیت ساخته و دانلود شد ')
      }
      fetchBackupHistory()
    } catch { toast.error('متأسفانه در ساخت پشتیبان خطایی رخ داد ') }
  }

  const restoreBackup = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip,.sql,.sqlite,.db'
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (!window.confirm('بازیابی اطلاعات، اطلاعات فعلی را کاملاً بازنویسی می‌کند. ادامه می‌دهید؟')) return
      const fd = new FormData()
      fd.append('file', file)
      try { await api.post('/auth/backup-restore/', fd); toast.success('بازیابی اطلاعات با موفقیت انجام شد '); fetchBackupHistory() }
      catch { toast.error('متأسفانه در بازیابی اطلاعات خطایی رخ داد ') }
    }
    input.click()
  }

  const downloadBackup = async (id: number) => {
    try {
      const { data } = await api.get('/auth/backup-history/' + id + '/download/')
      if ((data as any)?.file) { const link = document.createElement('a'); link.href = (data as any).file; link.download = ''; link.click() }
    } catch { toast.error('متأسفانه در دانلود فایل خطایی رخ داد ') }
  }

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <h3 className="flex items-center gap-2"><Database size={18} className="text-brand-500" /> پشتیبان‌گیری خودکار</h3>
        </div>
        <div className="panel-body space-y-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="backupEnabled" checked={backupEnabled} onChange={e => setBackupEnabled(e.target.checked)} />
            <label htmlFor="backupEnabled" className="text-sm">فعال‌سازی پشتیبان‌گیری خودکار</label>
          </div>
          <div className="form-grid">
            <div>
              <label className="label">زمان‌بندی</label>
              <select className="input-field" value={backupSchedule} onChange={e => setBackupSchedule(e.target.value)}>
                <option value="hourly">هر ساعت</option>
                <option value="daily">روزانه</option>
                <option value="weekly">هفتگی</option>
                <option value="monthly">ماهیانه</option>
              </select>
            </div>
            <div>
              <label className="label">ساعت</label>
              <input className="input-field" type="time" value={backupTime} onChange={e => setBackupTime(e.target.value)} />
            </div>
            <div>
              <label className="label">نگهداری (روز)</label>
              <input className="input-field" type="number" min={1} max={365} value={backupRetention} onChange={e => setBackupRetention(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={saveBackupSettings} icon={Save}>ذخیره تنظیمات پشتیبان</Button>
            <Button variant="secondary" icon={Download} onClick={manualBackup}>پشتیبان‌گیری دستی</Button>
            <Button variant="danger" icon={Upload} onClick={restoreBackup}>بازیابی از فایل</Button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="flex items-center gap-2"><Clock size={18} className="text-brand-500" /> تاریخچه پشتیبان‌ها</h3>
          <Button size="xs" variant="ghost" onClick={fetchBackupHistory}>بروزرسانی</Button>
        </div>
        <div className="panel-body">
          {backupHistory.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Database size={40} className="mx-auto mb-2 opacity-30" />
              <p>هنوز پشتیبان‌گیری انجام نشده</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr><th className="text-right p-2">تاریخ</th><th className="text-right p-2">نوع</th><th className="text-right p-2">وضعیت</th><th className="text-left p-2">دانلود</th></tr>
                </thead>
                <tbody>
                  {backupHistory.map(b => (
                    <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="p-2">{new Date(b.created_at).toLocaleDateString('fa-IR')}</td>
                      <td className="p-2">{b.type === 'auto' ? 'خودکار' : 'دستی'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${b.status === 'completed' ? 'bg-green-100 text-green-700' : b.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {b.status === 'completed' ? 'موفق' : b.status === 'failed' ? 'ناموفق' : 'در حال انجام'}
                        </span>
                      </td>
                      <td className="p-2 text-left"><Button size="xs" variant="ghost" onClick={() => downloadBackup(b.id)}><Download size={14} /></Button></td>
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
