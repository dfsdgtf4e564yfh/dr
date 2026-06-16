import { useState } from 'react'
import { X, User, Camera, Save, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'
import { updateMe, uploadAvatar, clearAvatar, changePassword } from '../services/api'
import { mediaUrl } from '../utils/jalali'
import Modal from './Modal'
import Button from './Button'
import type { User as UserType } from '../types'

interface ProfileModalProps {
  open: boolean
  onClose: () => void
  user: UserType | null
  loadUser: () => Promise<void>
}

export default function ProfileModal({ open, onClose, user, loadUser }: ProfileModalProps) {
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
    medical_council_number: user?.medical_council_number || '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileForm.first_name.trim() || !profileForm.last_name.trim()) {
      toast.error('لطفاً نام و نام خانوادگی را وارد کنید')
      return
    }
    setProfileSaving(true)
    try {
      const data: any = {
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        phone: profileForm.phone.trim(),
      }
      if (profileForm.specialization) data.specialization = profileForm.specialization.trim()
      if (profileForm.medical_council_number) data.medical_council_number = profileForm.medical_council_number.trim()
      await updateMe(data)
      toast.success('اطلاعات شما ذخیره شد')
      onClose()
      await loadUser()
    } catch {
      toast.error('خطا در ذخیره اطلاعات')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordForm.old_password || !passwordForm.new_password) {
      toast.error('لطفاً رمز فعلی و جدید را وارد کنید')
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('رمز جدید و تکرار آن مطابقت ندارند')
      return
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('رمز جدید حداقل ۶ کاراکتر باشد')
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      })
      toast.success('رمز عبور با موفقیت تغییر کرد')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err: any) {
      const data = err?.response?.data
      toast.error(data?.old_password?.[0] || data?.error || 'خطا در تغییر رمز عبور')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center mb-6">
        <div className="relative w-20 h-20 rounded-full mx-auto mb-4">
          {user?.avatar ? (
            <img src={mediaUrl(user.avatar)} alt="" className="w-20 h-20 rounded-full object-cover shadow-md shadow-brand-500/20" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center shadow-md shadow-brand-500/20">
              <User size={32} className="text-white" />
            </div>
          )}
          <label htmlFor="avatarUpload" className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center cursor-pointer shadow-sm hover:border-brand-500 transition-all">
            <Camera size={14} className="text-slate-500" />
          </label>
          <input id="avatarUpload" type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const fd = new FormData()
            fd.append('avatar', file)
            try {
              await uploadAvatar(fd)
              toast.success('تصویر پروفایل با موفقیت بارگذاری شد')
              await loadUser()
            } catch { toast.error('خطا در بارگذاری تصویر') }
          }} />
          {user?.avatar && (
            <button onClick={async () => {
              try { await clearAvatar(); toast.success('تصویر حذف شد'); await loadUser() }
              catch { toast.error('خطا در حذف تصویر') }
            }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] hover:bg-red-600 transition-all">
              <X size={10} />
            </button>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-800">پروفایل کاربری</h3>
        <p className="text-sm text-slate-500 mt-1">اطلاعات خود را مشاهده و ویرایش کنید</p>
      </div>

      <form onSubmit={handleProfileSave} className="space-y-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <label className="label">نام کاربری</label>
          <input className="input-field ltr bg-slate-50"
            value={user?.username || ''}
            readOnly />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">نام</label>
            <input className="input-field" placeholder="مثال: محمد"
              value={profileForm.first_name}
              onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })}
              required />
          </div>
          <div>
            <label className="label">نام خانوادگی</label>
            <input className="input-field" placeholder="مثال: طاهری"
              value={profileForm.last_name}
              onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })}
              required />
          </div>
        </div>
        <div>
          <label className="label">شماره تلفن</label>
          <input className="input-field ltr" dir="ltr" placeholder="مثال: 09123456789"
            value={profileForm.phone}
            onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
        </div>
        {(user?.role === 'doctor' || user?.role === 'psychologist') && (
          <>
            <div>
              <label className="label">تخصص</label>
              <input className="input-field" placeholder="مثال: روانپزشک"
                value={profileForm.specialization}
                onChange={e => setProfileForm({ ...profileForm, specialization: e.target.value })} />
            </div>
            <div>
              <label className="label">شماره نظام پزشکی</label>
              <input className="input-field ltr" dir="ltr" placeholder="مثال: ۱۲۳۴۵"
                value={profileForm.medical_council_number}
                onChange={e => setProfileForm({ ...profileForm, medical_council_number: e.target.value })} />
            </div>
          </>
        )}
        <Button type="submit" variant="gradient" className="w-full" loading={profileSaving} icon={Save}>ذخیره اطلاعات</Button>
      </form>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><Lock size={16} /> تغییر رمز عبور</h4>
        <div>
          <label className="label">رمز فعلی</label>
          <div className="relative">
            <input className="input-field ltr w-full" dir="ltr" type={showOld ? 'text' : 'password'} placeholder="••••••"
              value={passwordForm.old_password}
              onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })} />
            <button type="button" onClick={() => setShowOld(!showOld)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors" tabIndex={-1}>
              {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">رمز جدید</label>
          <div className="relative">
            <input className="input-field ltr w-full" dir="ltr" type={showNew ? 'text' : 'password'} placeholder="حداقل ۶ کاراکتر"
              value={passwordForm.new_password}
              onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors" tabIndex={-1}>
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">تکرار رمز جدید</label>
          <div className="relative">
            <input className="input-field ltr w-full" dir="ltr" type={showConfirm ? 'text' : 'password'} placeholder="تکرار رمز جدید"
              value={passwordForm.confirm_password}
              onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors" tabIndex={-1}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <Button type="submit" variant="gradient" className="w-full !bg-gradient-to-r from-amber-500 to-orange-500" loading={passwordSaving} icon={Lock}>تغییر رمز عبور</Button>
      </form>
    </Modal>
  )
}
