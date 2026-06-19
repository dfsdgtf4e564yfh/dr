import { useState } from 'react'
import { toast } from 'react-toastify'
import { MapPin, Image, Upload, User, Stethoscope, Hash, Save } from 'lucide-react'
import api from '../../services/api'
import { uploadSignature, clearSignature, getClinicSettings, updateMe } from '../../services/api'
import Button from '../Button'
import type { User as UserType, ClinicSettings as ClinicSettingsType } from '../../types'
import { mediaUrl } from '../../utils/jalali'

interface ClinicSectionProps {
  clinic: ClinicSettingsType
  setClinic: (clinic: ClinicSettingsType) => void
  logoFile: File | null
  setLogoFile: (file: File | null) => void
  user: UserType | null
  docProfile: { specialization: string; medical_council_number: string }
  setDocProfile: (profile: { specialization: string; medical_council_number: string }) => void
}

export default function ClinicSection({ clinic, setClinic, logoFile, setLogoFile, user, docProfile, setDocProfile }: ClinicSectionProps) {
  const saveClinic = async () => {
    try {
      const fd = new FormData()
      fd.append('clinic_name', (clinic as any).clinic_name || '')
      fd.append('address', clinic.address || '')
      fd.append('phone', clinic.phone || '')
      fd.append('phone2', clinic.phone2 || '')
      fd.append('phone3', clinic.phone3 || '')
      if (logoFile) fd.append('logo', logoFile)
      const settingId = clinic.id || 1
      await api.patch('/auth/clinic-settings/' + settingId + '/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('تنظیمات کلینیک با موفقیت ذخیره شد ')
      setLogoFile(null)
      getClinicSettings().then(({ data }) => {
        const s = Array.isArray(data) ? data[0] : data
        if (s) setClinic(s)
      })
    } catch (err: any) { toast.error(err.response?.data?.error || 'متأسفانه در ذخیره تنظیمات خطایی رخ داد ') }
  }

  const saveDocProfile = async () => {
    try {
      await updateMe({ specialization: docProfile.specialization, medical_council_number: docProfile.medical_council_number })
      toast.success('پروفایل پزشک / درمانگر با موفقیت ذخیره شد ')
      window.location.reload()
    } catch (err: any) { toast.error(err.response?.data?.error || 'متأسفانه در ذخیره پروفایل خطایی رخ داد ') }
  }

  return (
    <>
      <div className="panel card-iranian">
        <div className="panel-header panel-header-iranian">
          <h3 className="flex items-center gap-2"><MapPin size={18} className="text-brand-500" /> اطلاعات کلینیک</h3>
        </div>
        <div className="panel-body space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="label">نام کلینیک / مطب</label>
              <input className="input-field" value={(clinic as any).clinic_name || ''} onChange={e => setClinic({ ...clinic, clinic_name: e.target.value } as any)} placeholder="مثال: کلینیک دکتر طاهری" />
            </div>
            <div className="md:col-span-2">
              <label className="label">لوگوی کلینیک</label>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                  {logoFile ? <img src={URL.createObjectURL(logoFile)} alt="لوگو" className="max-w-full max-h-full object-contain p-1" /> : null}
                  {!logoFile && clinic?.logo ? <img src={mediaUrl(clinic.logo)} alt="لوگو" className="max-w-full max-h-full object-contain p-1" /> : null}
                  {!logoFile && (!clinic || !clinic.logo) ? <Image size={24} className="text-slate-300" /> : null}
                </div>
                <div>
                  <input type="file" id="clinicLogoInput" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) setLogoFile(file) }} />
                  <label htmlFor="clinicLogoInput" className="btn-secondary cursor-pointer inline-flex items-center gap-2 text-sm"><Upload size={14} /> انتخاب لوگو</label>
                  {logoFile ? <Button size="xs" variant="ghost" className="mr-2 text-red-500" onClick={() => setLogoFile(null)}>حذف</Button> : null}
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="label">آدرس مطب</label>
              <textarea className="input-field" rows={2} value={clinic.address || ''} onChange={e => setClinic({ ...clinic, address: e.target.value })} placeholder="آدرس کامل مطب..." />
            </div>
            <div>
              <label className="label">شماره تماس</label>
              <input className="input-field" value={clinic.phone || ''} onChange={e => setClinic({ ...clinic, phone: e.target.value })} placeholder="شماره تماس..." />
            </div>
            <div>
              <label className="label">شماره تماس دوم</label>
              <input className="input-field" value={clinic.phone2 || ''} onChange={e => setClinic({ ...clinic, phone2: e.target.value })} placeholder="شماره تماس دوم..." />
            </div>
            <div>
              <label className="label">شماره تماس سوم</label>
              <input className="input-field" value={clinic.phone3 || '09001577080'} onChange={e => setClinic({ ...clinic, phone3: e.target.value })} placeholder="شماره تماس سوم..." />
            </div>
          </div>
          <Button onClick={saveClinic} icon={Save}>ذخیره اطلاعات کلینیک</Button>
        </div>
      </div>

      {(user?.role === 'doctor' || user?.role === 'psychologist') && (
        <>
          <div className="panel card-iranian">
            <div className="panel-header panel-header-iranian">
              <h3 className="flex items-center gap-2"><User size={18} className="text-brand-500" /> پروفایل پزشک / درمانگر</h3>
            </div>
            <div className="panel-body space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label flex items-center gap-1"><Stethoscope size={14} /> تخصص</label>
                  <input className="input-field" value={docProfile.specialization} onChange={e => setDocProfile({ ...docProfile, specialization: e.target.value })} placeholder="متخصص اعصاب و روان" />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Hash size={14} /> شماره نظام پزشکی</label>
                  <input className="input-field" value={docProfile.medical_council_number} onChange={e => setDocProfile({ ...docProfile, medical_council_number: e.target.value })} placeholder="۱۲۳۴۵" />
                </div>
              </div>
              <Button onClick={saveDocProfile} icon={Save}>ذخیره پروفایل</Button>
            </div>
          </div>

          <div className="panel card-iranian">
            <div className="panel-header panel-header-iranian">
              <h3 className="flex items-center gap-2"><Upload size={18} className="text-brand-500" /> امضای پزشک</h3>
            </div>
            <div className="panel-body">
              <p className="text-sm text-slate-500 mb-3">تصویر امضای خود را بارگذاری کنید. این امضا در نسخه‌های چاپی نمایش داده می‌شود.</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-32 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden">
                  {user?.signature ? (
                    <img src={mediaUrl(user.signature)} alt="امضا" className="max-w-full max-h-full object-contain p-1" />
                  ) : <span className="text-xs text-slate-400">امضا نشده</span>}
                </div>
                <div>
                  <input type="file" id="signatureInput" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const fd = new FormData()
                    fd.append('signature', file)
                    try { await uploadSignature(fd); toast.success('امضا با موفقیت بارگذاری شد '); window.location.reload() }
                    catch (err: any) { toast.error(err.response?.data?.error || 'متأسفانه در بارگذاری امضا خطایی رخ داد ') }
                  }} />
                  <label htmlFor="signatureInput" className="btn-secondary cursor-pointer inline-flex items-center gap-2 text-sm"><Upload size={14} /> انتخاب تصویر امضا</label>
                  {user?.signature && (
                    <Button size="xs" variant="ghost" className="mr-2 text-red-500" onClick={async () => {
                      if (!window.confirm('آیا از حذف امضا اطمینان دارید؟')) return
                      try { await clearSignature(); toast.success('امضا با موفقیت حذف شد '); window.location.reload() }
                      catch (err: any) { toast.error(err.response?.data?.error || 'متأسفانه در حذف امضا خطایی رخ داد ') }
                    }}>حذف امضا</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
