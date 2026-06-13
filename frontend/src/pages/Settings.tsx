import { useState, useEffect } from 'react'
import { toPersianDigits } from '../utils/jalali'
import { getTreatmentTypes, getClinicSettings, getSmsTemplates } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import ClinicSection from '../components/settings/ClinicSection'
import SmsSection from '../components/settings/SmsSection'
import MessengerSection from '../components/settings/MessengerSection'
import BackupSection from '../components/settings/BackupSection'
import TreatmentSection from '../components/settings/TreatmentSection'
import ProfileSection from '../components/settings/ProfileSection'
import OnlineBookingSection from '../components/settings/OnlineBookingSection'
import type { ClinicSettings, SmsTemplate, User } from '../types'

interface DocProfile {
  specialization: string
  medical_council_number: string
}

interface SmsSettingsModal {
  visible: boolean
  mode: string
}

export default function Settings() {
  const { user } = useAuth()
  const [clinic, setClinic] = useState<ClinicSettings>({ id: null, clinic_name: '', logo: null, address: '', phone: '', phone2: '', phone3: '09001577080' } as any)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [docProfile, setDocProfile] = useState<DocProfile>({ specialization: '', medical_council_number: '' })
  const [treatments, setTreatments] = useState<any[]>([])
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  const [smsSettingsModal, setSmsSettingsModal] = useState<SmsSettingsModal>({ visible: false, mode: 'send' })

  useEffect(() => {
    getTreatmentTypes().then((res) => { const d = res.data as any; setTreatments(Array.isArray(d) ? d : d.results || []) }).catch(() => setTreatments([]))
    getClinicSettings().then((res) => {
      const d = res.data as any
      const s = Array.isArray(d) ? d[0] : d
      if (s) setClinic(s)
    }).catch(() => {})
    if (user) {
      setDocProfile({
        specialization: user.specialization || '',
        medical_council_number: user.medical_council_number || '',
      })
    }
    getSmsTemplates().then((res) => { const d = res.data as any; setTemplates(Array.isArray(d) ? d : d.results || []) }).catch(() => setTemplates([]))
  }, [user])

  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold text-slate-800">تنظیمات</h1>

      {/* تنظیمات کلینیک */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-bold text-slate-400 tracking-wider">تنظیمات کلینیک</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <ClinicSection
        clinic={clinic}
        setClinic={setClinic}
        logoFile={logoFile}
        setLogoFile={setLogoFile}
        user={user}
        docProfile={docProfile}
        setDocProfile={setDocProfile}
      />

      {isAdmin && (
        <OnlineBookingSection />
      )}

      {/* تنظیمات عمومی */}
      <div className="flex items-center gap-3 mb-2 mt-8">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-bold text-slate-400 tracking-wider">تنظیمات عمومی</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {isAdmin && (
        <>
          <SmsSection
            templates={templates}
            setTemplates={setTemplates}
            setSmsSettingsModal={setSmsSettingsModal}
          />
          <MessengerSection />
          <BackupSection />
          <TreatmentSection treatments={treatments} setTreatments={setTreatments} />
        </>
      )}

      <ProfileSection user={user} setUser={() => {}} />
    </div>
  )
}
