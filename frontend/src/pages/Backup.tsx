import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { Download, Trash2, RefreshCw, Database, FileDown, Upload, FileSpreadsheet, Mail, CheckCircle, XCircle, Save, Settings, Github, Globe, UploadCloud, Image, Archive, LogOut, ChevronDown } from 'lucide-react'
import { getBackups, createBackup, downloadDatabase, fullExportBackup, downloadBackup, deleteBackup, restoreBackup, restoreMedia, restoreEnvFile, exportPatientsCsv, exportAppointmentsCsv, exportMedicalRecordsCsv, exportBillingsCsv, importPatientsExcel, getEmailConfig, updateEmailConfig, testEmailConnection, sendBackupViaEmail, getGitHubConfig, updateGitHubConfig, testGitHubConnection, uploadBackupToGitHub, getGitHubAuthUrl, disconnectGitHub, listGitHubRepos } from '../services/api'
import { toJalali, toPersianDigits } from '../utils/jalali'
import ProgressBar from '../components/ProgressBar'
import BackupSection from '../components/settings/BackupSection'
import type { BackupItem, EmailConfig, GitHubConfig, GitHubRepo } from '../types'

interface EmailFormData {
  smtp_host: string
  smtp_port: number
  use_tls: boolean
  sender_email: string
  sender_password: string
  recipient_email: string
  auto_send: boolean
}

export default function Backup() {
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [creating, setCreating] = useState<boolean>(false)
  const [restoring, setRestoring] = useState<boolean>(false)
  const [elapsed, setElapsed] = useState<number>(0)
  const [importing, setImporting] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('local')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null)
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    use_tls: true,
    sender_email: '',
    sender_password: '',
    recipient_email: '',
    auto_send: false,
  })
  const [testingEmail, setTestingEmail] = useState<boolean>(false)
  const [sendingEmail, setSendingEmail] = useState<boolean>(false)
  const [savingEmail, setSavingEmail] = useState<boolean>(false)
  const [emailResult, setEmailResult] = useState<{ success: boolean; error?: string; sent?: number; total?: number } | null>(null)
  const [showEmailForm, setShowEmailForm] = useState<boolean>(true)

  const [githubConfig, setGitHubConfig] = useState<GitHubConfig | null>(null)
  const [githubForm, setGitHubForm] = useState({ repo: '', token: '', auto_upload: false, keep_last_n: 10 })
  const [oauthAppForm, setOauthAppForm] = useState({ oauth_client_id: '', oauth_client_secret: '' })
  const [testingGitHub, setTestingGitHub] = useState<boolean>(false)
  const [savingGitHub, setSavingGitHub] = useState<boolean>(false)
  const [savingOauthApp, setSavingOauthApp] = useState<boolean>(false)
  const [uploadingGitHub, setUploadingGitHub] = useState<boolean>(false)
  const [githubResult, setGitHubResult] = useState<{ success: boolean; error?: string; download_url?: string; release_url?: string } | null>(null)
  const [showGitHubForm, setShowGitHubForm] = useState<boolean>(true)
  const [showOauthAppForm, setShowOauthAppForm] = useState<boolean>(false)
  const [githubRepos, setGitHubRepos] = useState<GitHubRepo[]>([])
  const [githubConnected, setGitHubConnected] = useState<boolean>(false)
  const [githubLoadingRepos, setGithubLoadingRepos] = useState<boolean>(false)
  const [showRepoDropdown, setShowRepoDropdown] = useState<boolean>(false)

  useEffect(() => {
    if (restoring) {
      const start = Date.now()
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setElapsed(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [restoring])

  const formatElapsed = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getBackups()
      setBackups(Array.isArray(data) ? data : [])
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'خطایی رخ داد '
      toast.error(`دریافت لیست پشتیبان‌ها: ${typeof msg === 'string' ? msg.slice(0, 150) : 'خطای ناشناخته'}`)
    }
    finally { setLoading(false) }
  }

  const loadEmailConfig = async () => {
    try {
      const { data } = await getEmailConfig()
      setEmailConfig(data)
      setEmailForm({
        smtp_host: data.smtp_host,
        smtp_port: data.smtp_port,
        use_tls: data.use_tls,
        sender_email: data.sender_email,
        sender_password: '',
        recipient_email: data.recipient_email,
        auto_send: data.auto_send,
      })
      if (data.sender_email) setShowEmailForm(false)
    } catch {}
  }

  const loadGitHubConfig = async () => {
    try {
      const { data } = await getGitHubConfig()
      setGitHubConfig(data)
      setGitHubConnected(data.oauth_connected)
      setGitHubForm({
        repo: data.repo,
        token: '',
        auto_upload: data.auto_upload,
        keep_last_n: data.keep_last_n,
      })
      setOauthAppForm({
        oauth_client_id: '',
        oauth_client_secret: '',
      })
      if (data.repo) setShowGitHubForm(false)
      if (data.oauth_connected) fetchRepos()
    } catch {}
  }

  const handleSaveOauthApp = async () => {
    setSavingOauthApp(true)
    try {
      await updateGitHubConfig({ oauth_client_id: oauthAppForm.oauth_client_id, oauth_client_secret: oauthAppForm.oauth_client_secret })
      toast.success('تنظیمات اپ گیت‌هاب ذخیره شد')
      setShowOauthAppForm(false)
      loadGitHubConfig()
    } catch { toast.error('خطا در ذخیره تنظیمات اپ گیت‌هاب') }
    finally { setSavingOauthApp(false) }
  }

  const fetchRepos = async () => {
    setGithubLoadingRepos(true)
    try {
      const { data } = await listGitHubRepos()
      setGitHubRepos(data.repos)
      setGitHubConnected(true)
    } catch { setGitHubRepos([]) }
    finally { setGithubLoadingRepos(false) }
  }

  const handleConnectGitHub = async () => {
    try {
      const { data } = await getGitHubAuthUrl()
      if (data.url) {
        window.open(data.url, '_blank', 'width=800,height=700')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'خطا در اتصال به GitHub')
    }
  }

  const handleDisconnectGitHub = async () => {
    if (!window.confirm('آیا از قطع اتصال GitHub اطمینان دارید؟')) return
    try {
      await disconnectGitHub()
      setGitHubConnected(false)
      setGitHubRepos([])
      setGitHubForm(f => ({ ...f, repo: '' }))
      toast.success('اتصال GitHub قطع شد')
      loadGitHubConfig()
    } catch { toast.error('خطا در قطع اتصال GitHub') }
  }

  useEffect(() => { load(); loadEmailConfig(); loadGitHubConfig() }, [])

  const handleSaveEmail = async () => {
    setSavingEmail(true)
    try {
      await updateEmailConfig(emailForm)
      toast.success('تنظیمات ایمیل ذخیره شد ')
      setShowEmailForm(false)
      loadEmailConfig()
    } catch { toast.error('خطا در ذخیره تنظیمات ایمیل') }
    finally { setSavingEmail(false) }
  }

  const handleTestEmail = async () => {
    setTestingEmail(true)
    setEmailResult(null)
    try {
      await testEmailConnection()
      setEmailResult({ success: true })
      toast.success('اتصال SMTP با موفقیت برقرار شد ')
    } catch (err: any) {
      const msg = err.response?.data?.error || 'خطا در اتصال SMTP'
      setEmailResult({ success: false, error: msg })
      toast.error(msg)
    } finally { setTestingEmail(false) }
  }

  const handleSendEmail = async () => {
    if (!window.confirm('تمام فایل‌های پشتیبان از طریق ایمیل ارسال می‌شوند. ادامه می‌دهید؟')) return
    setSendingEmail(true)
    setEmailResult(null)
    try {
      const { data } = await sendBackupViaEmail()
      setEmailResult({ success: true, sent: data.sent, total: data.total })
      toast.success(`${data.sent} فایل با موفقیت ارسال شد `)
      loadEmailConfig()
    } catch (err: any) {
      const msg = err.response?.data?.error || 'خطا در ارسال ایمیل'
      setEmailResult({ success: false, error: msg })
      toast.error(msg)
    } finally { setSendingEmail(false) }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createBackup()
      toast.success('پشتیبان‌گیری با موفقیت انجام شد ')
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'خطایی رخ داد '
      toast.error(`پشتیبان‌گیری: ${typeof msg === 'string' ? msg.slice(0, 150) : 'خطای سرور'}`)
    }
    finally { setCreating(false) }
  }

  const handleDownload = async (filename: string) => {
    try {
      const { data } = await downloadBackup(filename)
      const url = window.URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('دانلود فایل پشتیبان شروع شد')
    } catch (err: any) {
      let msg = err?.response?.data?.error
      if (!msg && err?.response?.data instanceof Blob) {
        try { const t = await err.response.data.text(); const j = JSON.parse(t); msg = j.error } catch {}
      }
      if (msg && typeof msg === 'string') toast.error(msg.slice(0, 150))
      else toast.error('متأسفانه در دانلود فایل خطایی رخ داد ')
    }
  }

  const handleDelete = async (filename: string) => {
    if (!window.confirm('آیا از حذف این فایل پشتیبان اطمینان دارید؟')) return
    try {
      await deleteBackup(filename)
      toast.success('فایل پشتیبان با موفقیت حذف شد ')
      load()
    } catch (err: any) {
      const msg = err?.response?.data?.error
      if (msg && typeof msg === 'string') toast.error(msg.slice(0, 150))
      else toast.error('متأسفانه در حذف فایل خطایی رخ داد ')
    }
  }

  const handleRestoreMedia = async (b: any) => {
    if (!b.media_file) return
    if (!window.confirm('فایل‌های مدیا (آپلود بیماران، تصاویر، مدارک) با محتوای این پشتیبان جایگزین می‌شوند. ادامه می‌دهید؟')) return
    try {
      const { data } = await restoreMedia(b.media_file)
      toast.success((data as any).message || 'فایل‌های مدیا بازیابی شدند')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'خطا در بازیابی مدیا')
    }
  }

  const handleRestoreEnv = async (b: any) => {
    if (!b.env_file) return
    if (!window.confirm('فایل تنظیمات (.env) با محتوای این پشتیبان جایگزین می‌شود. ادامه می‌دهید؟')) return
    try {
      const { data } = await restoreEnvFile(b.env_file)
      toast.success((data as any).message || 'فایل تنظیمات بازیابی شد')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'خطا در بازیابی env')
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isSqlite = file.name.endsWith('.db') || file.name.endsWith('.sqlite') || file.name.endsWith('.sqlite3')
    const isZip = file.name.endsWith('.zip')
    if (!file.name.endsWith('.json') && !isSqlite && !isZip) {
      toast.error('فقط فایل‌های ZIP, JSON و SQLite پشتیبان قابل بازیابی هستند ')
      return
    }
    if (!window.confirm(' هشدار: با بازیابی، تمام داده‌های فعلی سیستم پاک شده و با داده‌های فایل پشتیبان جایگزین می‌شوند. آیا ادامه می‌دهید؟')) return
    setRestoring(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await restoreBackup(fd)
      toast.success('بازیابی اطلاعات با موفقیت انجام شد ')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'متأسفانه در بازیابی اطلاعات خطایی رخ داد ')
    }
    finally {
      setRestoring(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveGitHub = async () => {
    setSavingGitHub(true)
    try {
      await updateGitHubConfig({ repo: githubForm.repo, auto_upload: githubForm.auto_upload, keep_last_n: githubForm.keep_last_n })
      toast.success('تنظیمات GitHub ذخیره شد ')
      setShowGitHubForm(false)
      loadGitHubConfig()
    } catch { toast.error('خطا در ذخیره تنظیمات GitHub') }
    finally { setSavingGitHub(false) }
  }

  const handleTestGitHub = async () => {
    setTestingGitHub(true)
    setGitHubResult(null)
    try {
      const { data } = await testGitHubConnection(githubForm.repo || undefined)
      setGitHubResult({ success: true })
      toast.success(`اتصال به ${data.repo} برقرار شد${data.private ? ' (مخزن خصوصی)' : ' (مخزن عمومی)'}`)
    } catch (err: any) {
      const msg = err.response?.data?.error || 'خطا در اتصال به GitHub'
      setGitHubResult({ success: false, error: msg })
      toast.error(msg)
    } finally { setTestingGitHub(false) }
  }

  const handleUploadGitHub = async () => {
    setUploadingGitHub(true)
    setGitHubResult(null)
    try {
      const { data } = await uploadBackupToGitHub()
      setGitHubResult({ success: true, download_url: data.download_url, release_url: data.release_url })
      toast.success('فایل با موفقیت به GitHub آپلود شد ')
      loadGitHubConfig()
    } catch (err: any) {
      const msg = err.response?.data?.error || 'خطا در آپلود به GitHub'
      setGitHubResult({ success: false, error: msg })
      toast.error(msg)
    } finally { setUploadingGitHub(false) }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await importPatientsExcel(fd)
      toast.success(`${data.imported} بیمار با موفقیت از فایل اکسل وارد شدند`)
      if (data.skipped > 0) toast.info(`${data.skipped} بیمار تکراری یا ناقص نادیده گرفته شد ℹ`)
      if (data.errors?.length > 0) toast.warning(`${data.errors.length} خطا در حین ورود اطلاعات وجود داشت `)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'متأسفانه در ورود اطلاعات از اکسل خطایی رخ داد ')
    } finally {
      setImporting(false);
      (e.target as HTMLInputElement).value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">مدیریت پشتیبان</h1>
        <div className="flex gap-2">
          <button onClick={handleCreate} disabled={creating}
            className="btn-primary flex items-center gap-2">
            <Database size={18} /> {creating ? 'در حال پشتیبان‌گیری...' : 'پشتیبان‌گیری جدید'}
          </button>
          <button onClick={async () => {
            try {
              const { data } = await downloadDatabase()
              const url = window.URL.createObjectURL(new Blob([data]))
              const a = document.createElement('a')
              a.href = url
              a.download = 'clinic_database.db'
              a.click()
              window.URL.revokeObjectURL(url)
              toast.success('دانلود دیتابیس شروع شد')
            } catch (err: any) {
              let msg = err?.response?.data?.error
              if (!msg && err?.response?.data instanceof Blob) {
                try { const t = await err.response.data.text(); const j = JSON.parse(t); msg = j.error } catch {}
              }
              toast.error(typeof msg === 'string' ? msg.slice(0, 150) : 'خطا در دانلود دیتابیس')
            }
          }} className="btn-secondary flex items-center gap-2">
            <Download size={18} /> دانلود دیتابیس
          </button>
          <button onClick={async () => {
            setCreating(true)
            try {
              const resp = await fullExportBackup()
              const url = window.URL.createObjectURL(new Blob([resp.data]))
              const a = document.createElement('a')
              a.href = url
              const disposition = resp.headers?.['content-disposition'] || ''
              const match = disposition.match(/filename="?(.+?)"?$/)
              a.download = match?.[1] || `full_backup_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.zip`
              a.click()
              window.URL.revokeObjectURL(url)
              toast.success('پشتیبان کامل با موفقیت دانلود شد')
            } catch (err: any) {
              let msg = err?.response?.data?.error
              if (!msg && err?.response?.data instanceof Blob) {
                try { const t = await err.response.data.text(); const j = JSON.parse(t); msg = j.error } catch {}
              }
              toast.error(typeof msg === 'string' ? msg.slice(0, 200) : 'خطا در دانلود پشتیبان کامل')
            }
            finally { setCreating(false) }
          }} className="btn-primary flex items-center gap-2">
            <Archive size={18} /> دانلود پشتیبان کامل
          </button>
        </div>
      </div>

      {creating && <ProgressBar progress={100} label="در حال ایجاد پشتیبان..." size="sm" />}
      {restoring && <ProgressBar progress={100} label="در حال بازیابی..." size="sm" />}

      <BackupSection />

      <div className="card bg-amber-50 border-amber-200 text-sm text-amber-800">
        <p>با کلیک بر روی دکمه "پشتیبان‌گیری جدید"، از تمام اطلاعات سیستم یک فایل پشتیبان تهیه می‌شود.</p>
        <p className="mt-1">فایل‌های پشتیبان در پوشه backend/backups ذخیره می‌شوند. برای بازیابی، فایل پشتیبان (.db یا .sqlite3) را انتخاب کنید.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button onClick={() => setActiveTab('local')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'local' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Database size={16} className="inline ml-1" />محلی
        </button>
        <button onClick={() => setActiveTab('email')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'email' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Mail size={16} className="inline ml-1" />ایمیل
        </button>
        <button onClick={() => setActiveTab('github')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'github' ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Github size={16} className="inline ml-1" />گیت‌هاب
        </button>
      </div>

      {activeTab === 'local' && (
        <>
          <div className="panel card-iranian">
            <div className="panel-header panel-header-iranian">
              <h3 className="flex items-center gap-2"><Upload size={18} className="text-brand-500" /> بازیابی از فایل پشتیبان</h3>
            </div>
            <div className="panel-body">
              <p className="text-sm text-slate-500 mb-3">فایل پشتیبان (.zip از پشتیبان کامل، .db یا .sqlite3) را انتخاب کنید. تمام داده‌های فعلی پاک شده و با داده‌های فایل جایگزین می‌شوند. در صورت استفاده از فایل ZIP کامل (شامل مدیا و env)، دیتابیس + فایل‌ها + تنظیمات همگی یکجا بازیابی می‌شوند.</p>
              <div className="flex items-center gap-3">
                <input type="file" ref={fileInputRef} accept=".json,.db,.sqlite,.sqlite3,.zip" onChange={handleRestore} className="hidden" id="restoreFileInput" />
                <label htmlFor="restoreFileInput" className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload size={16} /> انتخاب فایل پشتیبان
                </label>
                {restoring && (
                  <span className="text-amber-600 text-sm flex items-center gap-2 font-mono">
                    <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    در حال بازیابی... {formatElapsed(elapsed)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="panel card-iranian">
            <div className="panel-header panel-header-iranian">
              <h3 className="flex items-center gap-2"><FileSpreadsheet size={18} className="text-brand-500" /> ورود بیماران از اکسل</h3>
            </div>
            <div className="panel-body">
              <p className="text-sm text-slate-500 mb-3">با انتخاب فایل اکسل، بیماران به صورت خودکار وارد سیستم می‌شوند. کد ملی تکراری نادیده گرفته می‌شود.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" id="excelImportInput" />
                <label htmlFor="excelImportInput" className="btn-secondary cursor-pointer flex items-center gap-2">
                  <Upload size={16} /> {importing ? 'در حال ورود...' : 'انتخاب فایل اکسل'}
                </label>
                <a href="/samples/patients_sample.xlsx" download
                  className="text-xs text-brand-500 hover:text-brand-700 flex items-center gap-1 no-underline">
                  <FileSpreadsheet size={14} /> دانلود نمونه اکسل
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-secondary flex items-center gap-1"><RefreshCw size={16} /> بروزرسانی</button>
            <button onClick={() => exportPatientsCsv().then(r => { const url = URL.createObjectURL(new Blob([r.data])); const a = document.createElement('a'); a.href = url; a.download = 'patients.csv'; a.click(); toast.success('خروجی CSV بیماران با موفقیت دریافت شد') }).catch(() => toast.error('متأسفانه در خروجی CSV خطایی رخ داد '))} className="btn-secondary flex items-center gap-1"><FileDown size={16} /> خروجی CSV بیماران</button>
            <button onClick={() => exportAppointmentsCsv().then(r => { const url = URL.createObjectURL(new Blob([r.data])); const a = document.createElement('a'); a.href = url; a.download = 'appointments.csv'; a.click(); toast.success('خروجی CSV نوبت‌ها با موفقیت دریافت شد') }).catch(() => toast.error('متأسفانه در خروجی CSV خطایی رخ داد '))} className="btn-secondary flex items-center gap-1"><FileDown size={16} /> خروجی CSV نوبت‌ها</button>
            <button onClick={() => exportMedicalRecordsCsv().then(r => { const url = URL.createObjectURL(new Blob([r.data])); const a = document.createElement('a'); a.href = url; a.download = 'medical_records.csv'; a.click(); toast.success('خروجی CSV پرونده پزشکی با موفقیت دریافت شد') }).catch(() => toast.error('متأسفانه در خروجی CSV خطایی رخ داد '))} className="btn-secondary flex items-center gap-1"><FileDown size={16} /> خروجی CSV پرونده پزشکی</button>
            <button onClick={() => exportBillingsCsv().then(r => { const url = URL.createObjectURL(new Blob([r.data])); const a = document.createElement('a'); a.href = url; a.download = 'billings.csv'; a.click(); toast.success('خروجی CSV صورتحساب‌ها با موفقیت دریافت شد') }).catch(() => toast.error('متأسفانه در خروجی CSV خطایی رخ داد '))} className="btn-secondary flex items-center gap-1"><FileDown size={16} /> خروجی CSV صورتحساب‌ها</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" /></div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-gray-600">
                  <th className="text-center py-3 px-2">نام فایل</th>
                  <th className="text-center py-3 px-2">تاریخ</th>
                  <th className="text-center py-3 px-2">حجم</th>
                  <th className="text-center py-3 px-2">شامل</th>
                  <th className="text-center py-3 px-2">بازیابی</th>
                  <th className="text-center py-3 px-2">عملیات</th>
                </tr></thead>
                <tbody>
                  {backups.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">هیچ فایل پشتیبان یافت نشد</td></tr>
                  ) : backups.map((b, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 text-xs">{b.filename}</td>
                      <td className="py-3 px-2 text-xs">{toJalali((b as any).created)}</td>
                      <td className="py-3 px-2 text-xs">{b.size ? `${toPersianDigits((b.size / 1024).toFixed(1))} KB` : '—'}</td>
                      <td className="text-center py-3 px-2">
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${(b as any).includes_media !== false ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`} title={((b as any).includes_media !== false) ? 'شامل فایل‌های آپلودی' : 'بدون فایل آپلودی'}>
                            <Image size={12} />
                          </span>
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${(b as any).includes_env !== false ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`} title={((b as any).includes_env !== false) ? 'شامل تنظیمات' : 'بدون تنظیمات'}>
                            <Settings size={12} />
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleRestoreMedia(b)} disabled={!(b as any).media_file} className={`p-1 rounded text-xs ${(b as any).media_file ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 cursor-not-allowed'}`} title="بازیابی فایل‌های مدیا">
                            <Image size={14} />
                          </button>
                          <button onClick={() => handleRestoreEnv(b)} disabled={!(b as any).env_file} className={`p-1 rounded text-xs ${(b as any).env_file ? 'text-amber-600 hover:bg-amber-50' : 'text-gray-300 cursor-not-allowed'}`} title="بازیابی فایل تنظیمات (.env)">
                            <Settings size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleDownload(b.filename)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="دانلود"><Download size={16} /></button>
                          <button onClick={() => handleDelete(b.filename)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'github' && (
        <div className="space-y-4">
          {/* GitHub App Credentials */}
          <div className="panel card-iranian">
            <div className="panel-header panel-header-iranian">
              <h3 className="flex items-center gap-2"><Settings size={18} className="text-brand-500" /> تنظیمات اپ گیت‌هاب</h3>
              <button onClick={() => setShowOauthAppForm(!showOauthAppForm)} className="btn-secondary text-xs flex items-center gap-1 px-2 py-1">
                {showOauthAppForm ? 'بستن' : (githubConfig?.has_client_id ? 'ویرایش' : 'تنظیم')}
              </button>
            </div>
            {showOauthAppForm && (
              <div className="panel-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Client ID</label>
                    <input className="input-field" type="text" dir="ltr" value={oauthAppForm.oauth_client_id}
                      onChange={e => setOauthAppForm(f => ({ ...f, oauth_client_id: e.target.value }))}
                      placeholder={githubConfig?.has_client_id ? '•••••• (برای تغییر وارد کنید)' : ''} />
                  </div>
                  <div>
                    <label className="label">Client Secret</label>
                    <input className="input-field" type="password" dir="ltr" value={oauthAppForm.oauth_client_secret}
                      onChange={e => setOauthAppForm(f => ({ ...f, oauth_client_secret: e.target.value }))}
                      placeholder={githubConfig?.has_client_id ? '•••••• (برای تغییر وارد کنید)' : ''} />
                  </div>
                </div>
                <p className="text-xs text-surface-400 mt-2">
                  از GitHub → Settings → Developer settings → OAuth Apps یک اپ جدید با
                  Callback URL: <code dir="ltr" className="bg-slate-100 px-1 rounded">{window.location.origin}/api/backup/github/callback/</code> بسازید.
                </p>
                <button onClick={handleSaveOauthApp} disabled={savingOauthApp} className="btn-primary mt-3 flex items-center gap-2">
                  <Save size={16} /> {savingOauthApp ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
              </div>
            )}
            {githubConfig?.has_client_id && !showOauthAppForm && (
              <div className="panel-body">
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                  <CheckCircle size={16} /> اپ گیت‌هاب تنظیم شده است
                </div>
              </div>
            )}
          </div>

          {/* GitHub Connection */}
          <div className="panel card-iranian">
            <div className="panel-header panel-header-iranian">
              <h3 className="flex items-center gap-2"><Github size={18} className="text-brand-500" /> اتصال به GitHub</h3>
              {!showGitHubForm && githubConfig?.repo && (
                <button onClick={() => setShowGitHubForm(true)} className="btn-secondary text-xs flex items-center gap-1 px-2 py-1">
                  <Settings size={14} /> ویرایش
                </button>
              )}
            </div>
            <div className="panel-body">

              {/* OAuth Connection Status */}
              <div className="mb-4 p-3 rounded-lg border bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github size={20} className={githubConnected ? 'text-green-600' : 'text-slate-400'} />
                    <div>
                      <span className="text-sm font-medium">{githubConnected ? 'متصل به GitHub' : 'به GitHub متصل نیستید'}</span>
                      {githubConnected && githubConfig?.github_user && (
                        <span className="text-xs text-slate-500 block">{githubConfig.github_user}</span>
                      )}
                    </div>
                  </div>
                  {!githubConnected ? (
                    <button onClick={handleConnectGitHub} disabled={!githubConfig?.has_client_id && !(window as any).APP_CONFIG?.GITHUB_CLIENT_ID} className="btn-primary text-xs flex items-center gap-1 px-3 py-1.5">
                      <Github size={14} /> اتصال به GitHub
                    </button>
                  ) : (
                    <button onClick={handleDisconnectGitHub} className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50">
                      <LogOut size={14} /> قطع اتصال
                    </button>
                  )}
                </div>
                {!githubConnected && !githubConfig?.has_client_id && !(window as any).APP_CONFIG?.GITHUB_CLIENT_ID && (
                  <p className="text-xs text-amber-600 mt-2">ابتدا Client ID و Client Secret اپ گیت‌هاب را در بخش بالایی وارد کنید.</p>
                )}
              </div>

              {githubConnected && (
                <div className="space-y-3">
                  {/* Repo Selector */}
                  <div>
                    <label className="label">انتخاب ریپازیتوری</label>
                    {githubLoadingRepos ? (
                      <p className="text-sm text-slate-400">در حال بارگذاری ریپازیتوری‌ها...</p>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setShowRepoDropdown(!showRepoDropdown)}
                          className="input-field w-full text-right flex items-center justify-between"
                        >
                          <span>{githubForm.repo || 'یک ریپازیتوری انتخاب کنید...'}</span>
                          <ChevronDown size={16} className="text-slate-400" />
                        </button>
                        {showRepoDropdown && (
                          <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {githubRepos.length === 0 ? (
                              <p className="p-3 text-sm text-slate-400">ریپازیتوری‌ای یافت نشد</p>
                            ) : (
                              githubRepos.map(repo => (
                                <button
                                  key={repo.full_name}
                                  onClick={() => {
                                    setGitHubForm(f => ({ ...f, repo: repo.full_name }))
                                    setShowRepoDropdown(false)
                                  }}
                                  className={`w-full text-right px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${githubForm.repo === repo.full_name ? 'bg-brand-50 text-brand-600' : ''}`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${repo.private ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                  {repo.full_name}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">آپلود خودکار پس از بکاپ</label>
                      <select className="input-field" value={githubForm.auto_upload ? '1' : '0'}
                        onChange={e => setGitHubForm(f => ({ ...f, auto_upload: e.target.value === '1' }))}>
                        <option value="0">غیرفعال</option>
                        <option value="1">فعال</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">تعداد Release نگهداری</label>
                      <input className="input-field" type="number" value={githubForm.keep_last_n}
                        onChange={e => setGitHubForm(f => ({ ...f, keep_last_n: parseInt(e.target.value) || 10 }))} />
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <button onClick={handleSaveGitHub} disabled={savingGitHub || !githubForm.repo} className="btn-primary flex items-center gap-2">
                      <Save size={16} /> {savingGitHub ? 'در حال ذخیره...' : 'ذخیره'}
                    </button>
                    <button onClick={handleTestGitHub} disabled={testingGitHub || !githubForm.repo} className="btn-secondary flex items-center gap-2">
                      <Globe size={16} /> {testingGitHub ? 'در حال تست...' : 'تست اتصال'}
                    </button>
                    <button onClick={fetchRepos} disabled={githubLoadingRepos} className="btn-secondary flex items-center gap-2">
                      <RefreshCw size={16} className={githubLoadingRepos ? 'animate-spin' : ''} /> بروزرسانی لیست
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Config Display */}
              {!showGitHubForm && githubConfig?.repo && (
                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle size={16} className="text-green-600" />
                        {githubConfig.repo}
                      </div>
                    </div>
                    {githubConfig.last_upload_at && (
                      <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                        <span className="text-xs text-slate-500">آخرین آپلود</span>
                        <p className="text-sm font-medium">{new Date(githubConfig.last_upload_at).toLocaleString('fa-IR')}</p>
                        {githubConfig.last_upload_file && (
                          <p className="text-xs text-slate-400 truncate">{githubConfig.last_upload_file}</p>
                        )}
                      </div>
                    )}
                    <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                      <span className="text-xs text-slate-500">آپلود خودکار</span>
                      <p className="text-sm font-medium">{githubConfig.auto_upload ? 'فعال' : 'غیرفعال'}</p>
                    </div>
                  </div>
                  {githubConfig.last_upload_status && (
                    <div className={`mb-3 p-2 rounded-lg text-xs ${githubConfig.last_upload_status.startsWith('موفق') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {githubConfig.last_upload_status}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleUploadGitHub} disabled={uploadingGitHub} className="btn-secondary flex items-center gap-2">
                      <UploadCloud size={16} /> {uploadingGitHub ? 'در حال آپلود...' : 'ارسال آخرین فایل بکاپ به GitHub'}
                    </button>
                  </div>
                </div>
              )}

              {githubResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${githubResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  <div className="flex items-center gap-2 font-medium">
                    {githubResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {githubResult.success ? 'آپلود با موفقیت انجام شد' : githubResult.error}
                  </div>
                  {githubResult.success && githubResult.download_url && (
                    <a href={githubResult.download_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-brand-600 hover:underline mt-1 inline-flex items-center gap-1">
                      <Download size={12} /> مشاهده فایل در GitHub
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="space-y-4">
          <div className="panel card-iranian">
            <div className="panel-header panel-header-iranian">
              <h3 className="flex items-center gap-2"><Mail size={18} className="text-brand-500" /> تنظیمات ایمیل</h3>
              {!showEmailForm && emailConfig?.sender_email && (
                <button onClick={() => setShowEmailForm(true)} className="btn-secondary text-xs flex items-center gap-1 px-2 py-1">
                  <Settings size={14} /> ویرایش
                </button>
              )}
            </div>
            <div className="panel-body">
              {(showEmailForm || !emailConfig?.sender_email) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="label">هاست SMTP</label>
                    <input className="input-field" type="text" value={emailForm.smtp_host}
                      onChange={e => setEmailForm(f => ({ ...f, smtp_host: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">پورت</label>
                    <input className="input-field" type="number" value={emailForm.smtp_port}
                      onChange={e => setEmailForm(f => ({ ...f, smtp_port: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">ایمیل فرستنده</label>
                    <input className="input-field" type="email" value={emailForm.sender_email}
                      onChange={e => setEmailForm(f => ({ ...f, sender_email: e.target.value }))}
                      placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="label">رمز ایمیل (App Password)</label>
                    <input className="input-field" type="password" value={emailForm.sender_password}
                      onChange={e => setEmailForm(f => ({ ...f, sender_password: e.target.value }))}
                      placeholder={(emailConfig as any)?.has_password ? '•••••• (برای تغییر وارد کنید)' : ''} />
                  </div>
                  <div>
                    <label className="label">ایمیل گیرنده</label>
                    <input className="input-field" type="email" value={emailForm.recipient_email}
                      onChange={e => setEmailForm(f => ({ ...f, recipient_email: e.target.value }))}
                      placeholder="backup@email.com" />
                  </div>
                  <div>
                    <label className="label">TLS</label>
                    <select className="input-field" value={emailForm.use_tls ? '1' : '0'}
                      onChange={e => setEmailForm(f => ({ ...f, use_tls: e.target.value === '1' }))}>
                      <option value="1">فعال</option>
                      <option value="0">غیرفعال</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">ارسال خودکار پس از بکاپ</label>
                    <select className="input-field" value={emailForm.auto_send ? '1' : '0'}
                      onChange={e => setEmailForm(f => ({ ...f, auto_send: e.target.value === '1' }))}>
                      <option value="0">غیرفعال</option>
                      <option value="1">فعال</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button onClick={handleSaveEmail} disabled={savingEmail} className="btn-primary flex items-center gap-2">
                      <Save size={16} /> {savingEmail ? 'در حال ذخیره...' : 'ذخیره'}
                    </button>
                    <button onClick={handleTestEmail} disabled={testingEmail} className="btn-secondary flex items-center gap-2">
                      <CheckCircle size={16} /> {testingEmail ? 'در حال تست...' : 'تست اتصال'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle size={16} className="text-green-600" />
                        {emailConfig.sender_email}
                      </div>
                      <span className="text-xs text-slate-500">ارسال به {emailConfig.recipient_email}</span>
                    </div>
                    {(emailConfig as any).last_sent_at && (
                      <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                        <span className="text-xs text-slate-500">آخرین ارسال</span>
                        <p className="text-sm font-medium">{new Date((emailConfig as any).last_sent_at).toLocaleString('fa-IR')}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
                      <span className="text-xs text-slate-500">ارسال خودکار</span>
                      <p className="text-sm font-medium">{emailConfig.auto_send ? 'فعال' : 'غیرفعال'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleSendEmail} disabled={sendingEmail} className="btn-secondary flex items-center gap-2">
                      <Mail size={16} /> {sendingEmail ? 'در حال ارسال...' : 'ارسال فایل‌ها از طریق ایمیل'}
                    </button>
                  </div>
                </div>
              )}

              {emailResult && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${emailResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  <div className="flex items-center gap-2 font-medium">
                    {emailResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {emailResult.success
                      ? (emailResult.sent !== undefined ? `${emailResult.sent} فایل با موفقیت ارسال شد` : 'اتصال SMTP برقرار است')
                      : emailResult.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
