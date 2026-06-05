import { useState } from 'react'
import { toast } from 'react-toastify'
import { User, Shield, Lock, Eye, EyeOff, Save } from 'lucide-react'
import api from '../../services/api'
import Button from '../Button'
import type { User as UserType } from '../../types'

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

  const inputClass = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all bg-white"
  const labelClass = "block text-xs font-medium text-slate-500 mb-1"

  return (
    <>
      <div className="panel">
        <div className="panel-header">
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

      <div className="panel">
        <div className="panel-header">
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
    </>
  )
}
