import { useState } from 'react'
import { toast } from 'react-toastify'
import { User, Shield, Lock, Eye, EyeOff, Save, Smartphone, Key, CheckCircle, XCircle, HardDrive, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import Button from '../Button'
import type { User as UserType, TotpSetupResponse } from '../../types'

interface ProfileSectionProps {
  user: UserType | null
  setUser: (user: UserType) => void
}

export default function ProfileSection({ user, setUser }: ProfileSectionProps) {
  const [profileForm, setProfileForm] = useState({ username: user?.username || '', email: user?.email || '', phone: user?.phone || '' })
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [totpLoading, setTotpLoading] = useState(false)
  const [totpSetup, setTotpSetup] = useState<TotpSetupResponse | null>(null)
  const [totpVerifyCode, setTotpVerifyCode] = useState('')

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const { data } = await api.patch('/auth/my-profile/', profileForm)
      if (data) { setUser(data as UserType); toast.success('پروفایل شما با موفقیت به‌روزرسانی شد ') }
    } catch { toast.error('متأسفانه در ذخیره پروفایل خطایی رخ داد ') }
    finally { setSavingProfile(false) }
  }

  const changePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) { toast.error('رمز عبور جدید و تکرار آن یکسان نیستند '); return }
    if (passwordForm.new_password.length < 6) { toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد '); return }
    setSavingPassword(true)
    try {
      await api.post('/auth/change-password/', { old_password: passwordForm.old_password, new_password: passwordForm.new_password })
      toast.success('رمز عبور شما با موفقیت تغییر کرد ')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch { toast.error('متأسفانه در تغییر رمز عبور خطایی رخ داد ') }
    finally { setSavingPassword(false) }
  }

  const startTotpSetup = async () => {
    setTotpLoading(true)
    try {
      const { data } = await api.post<TotpSetupResponse>('/auth/users/totp_setup/')
      setTotpSetup(data)
      setTotpVerifyCode('')
    } catch { toast.error('خطا در راه‌اندازی Google Authenticator') }
    finally { setTotpLoading(false) }
  }

  const verifyTotp = async () => {
    if (!totpVerifyCode || totpVerifyCode.length < 6) { toast.error('کد ۶ رقمی را وارد کنید'); return }
    setTotpLoading(true)
    try {
      await api.post('/auth/users/totp_verify/', { code: totpVerifyCode })
      toast.success('Google Authenticator با موفقیت فعال شد')
      setTotpSetup(null)
      setTotpVerifyCode('')
      const { data: me } = await api.get('/auth/users/me/')
      setUser(me as UserType)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'کد نامعتبر است')
    } finally { setTotpLoading(false) }
  }

  const disableTotp = async () => {
    setTotpLoading(true)
    try {
      await api.post('/auth/users/totp_disable/')
      toast.success('Google Authenticator غیرفعال شد')
      const { data: me } = await api.get('/auth/users/me/')
      setUser(me as UserType)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'خطا در غیرفعال‌سازی')
    } finally { setTotpLoading(false) }
  }

  const totpEnabled = (user as any)?.totp_enabled

  const [diskHealth, setDiskHealth] = useState<any>(null)
  const [diskLoading, setDiskLoading] = useState(false)

  const checkDiskHealth = async () => {
    setDiskLoading(true)
    try {
      const { data } = await api.get('/health/disk/')
      setDiskHealth(data)
      if (data.status === 'ok') toast.success('وضعیت دیسک: سالم')
      else toast.warning('وضعیت دیسک: مشکل دارد')
    } catch {
      toast.error('خطا در بررسی وضعیت دیسک')
    } finally { setDiskLoading(false) }
  }

  const inputClass = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all bg-white"
  const labelClass = "block text-xs font-medium text-slate-500 mb-1"

  return (
    <>
      <div className="panel card-iranian">
        <div className="panel-header panel-header-iranian">
          <h3 className="flex items-center gap-2"><User size={18} className="text-brand-500" /> ویرایش پروفایل</h3>
        </div>
        <div className="panel-body space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>نام کاربری</label>
              <input className={inputClass} value={profileForm.username} onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>ایمیل</label>
              <input className={inputClass} type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>شماره تماس</label>
              <input className={inputClass} value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
            </div>
          </div>
          <Button onClick={saveProfile} loading={savingProfile} icon={Save}>ذخیره پروفایل</Button>
        </div>
      </div>

      <div className="panel card-iranian">
        <div className="panel-header panel-header-iranian">
          <h3 className="flex items-center gap-2"><Shield size={18} className="text-brand-500" /> تغییر رمز عبور</h3>
        </div>
        <div className="panel-body space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>رمز عبور فعلی</label>
              <div className="relative">
                <input className={inputClass + ' ltr text-left'} type={showOld ? 'text' : 'password'} value={passwordForm.old_password} onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })} />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowOld(!showOld)}>{showOld ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>رمز عبور جدید</label>
              <div className="relative">
                <input className={inputClass + ' ltr text-left'} type={showNew ? 'text' : 'password'} value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowNew(!showNew)}>{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>تکرار رمز عبور جدید</label>
              <div className="relative">
                <input className={inputClass + ' ltr text-left'} type={showConfirm ? 'text' : 'password'} value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
          </div>
          <Button onClick={changePassword} loading={savingPassword} icon={Lock} variant="primary">تغییر رمز عبور</Button>
        </div>
      </div>

      <div className="panel card-iranian">
        <div className="panel-header panel-header-iranian">
          <h3 className="flex items-center gap-2"><Smartphone size={18} className="text-emerald-500" /> Google Authenticator</h3>
        </div>
        <div className="panel-body space-y-4">
          {totpEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg px-4 py-3 border border-emerald-200">
                <CheckCircle size={20} />
                <span className="text-sm font-semibold">Google Authenticator فعال است</span>
              </div>
              {!totpSetup && (
                <Button onClick={disableTotp} loading={totpLoading} variant="danger" icon={XCircle}>غیرفعال کردن</Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">با اسکن کد QR در اپلیکیشن Google Authenticator، امنیت حساب خود را افزایش دهید.</p>
              {!totpSetup ? (
                <Button onClick={startTotpSetup} loading={totpLoading} icon={Smartphone} variant="gradient">راه‌اندازی Google Authenticator</Button>
              ) : null}
            </div>
          )}

          {totpSetup && (
            <div className="space-y-4 border-t border-slate-200 pt-4 mt-2">
              {totpSetup.qr_code ? (
                <div className="flex justify-center">
                  <img src={totpSetup.qr_code} alt="QR Code" className="w-48 h-48 border-2 border-slate-200 rounded-xl p-2" />
                </div>
              ) : null}
              {totpSetup.secret ? (
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <label className={labelClass}>کلید مخفی (در صورت عدم اسکن QR)</label>
                  <div className="font-mono text-sm text-slate-700 bg-white border border-slate-200 rounded px-3 py-2 mt-1 select-all">{totpSetup.secret}</div>
                </div>
              ) : null}
              <div>
                <label className={labelClass}>کد ۶ رقمی Google Authenticator را وارد کنید</label>
                <div className="flex gap-2">
                  <input className={inputClass + ' text-center text-lg tracking-[0.3em] font-bold ltr'} style={{ direction: 'ltr' }}
                    value={totpVerifyCode}
                    onChange={e => setTotpVerifyCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="••••••"
                    inputMode="numeric" />
                  <Button onClick={verifyTotp} loading={totpLoading} variant="gradient">تایید</Button>
                </div>
              </div>
              <Button onClick={() => setTotpSetup(null)} variant="ghost" size="sm" className="text-xs">انصراف</Button>
            </div>
          )}
        </div>
      </div>
      <div className="panel card-iranian">
        <div className="panel-header panel-header-iranian">
          <h3 className="flex items-center gap-2"><HardDrive size={18} className="text-purple-500" /> وضعیت دیسک</h3>
        </div>
        <div className="panel-body space-y-3">
          <Button onClick={checkDiskHealth} loading={diskLoading} icon={RefreshCw}>بررسی وضعیت دیسک</Button>
          {diskHealth && (
            <div className="space-y-3 text-sm">
              <div className={`flex items-center gap-2 rounded-lg px-4 py-3 border ${diskHealth.status === 'ok' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                {diskHealth.status === 'ok' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                <span className="font-semibold">وضعیت: {diskHealth.status === 'ok' ? 'سالم' : 'مشکل دارد'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['STATIC_ROOT', 'MEDIA_ROOT'].map(key => {
                  const c = diskHealth.checks?.[key]
                  if (!c) return null
                  return (
                    <div key={key} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <p className="text-xs font-bold text-slate-600 mb-2">{key}</p>
                      <p className={`text-xs ${c.exists && c.writable ? 'text-emerald-600' : 'text-red-500'}`}>
                        {c.exists ? 'موجود' : 'وجود ندارد'} | {c.writable ? 'قابل نوشتن' : 'غیرقابل نوشتن'}
                      </p>
                      {diskHealth.checks.disk_usage?.[key] && (
                        <p className="text-xs text-slate-400 mt-1">
                          {Math.round(diskHealth.checks.disk_usage[key].free_bytes / 1073741824)} GB آزاد
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
              {diskHealth.checks?.test_file_io && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs font-bold text-slate-600 mb-1">تست I/O</p>
                  <p className={`text-xs ${diskHealth.checks.test_file_io.write_ok && diskHealth.checks.test_file_io.read_ok && diskHealth.checks.test_file_io.delete_ok ? 'text-emerald-600' : 'text-red-500'}`}>
                    نوشتن: {diskHealth.checks.test_file_io.write_ok ? '✓' : '✗'} |
                    خواندن: {diskHealth.checks.test_file_io.read_ok ? '✓' : '✗'} |
                    حذف: {diskHealth.checks.test_file_io.delete_ok ? '✓' : '✗'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
