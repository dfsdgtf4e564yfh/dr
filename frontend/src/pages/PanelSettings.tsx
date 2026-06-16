import { useState, useEffect } from 'react'
import { getTreatmentTypes, getClinicSettings } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import ClinicSection from '../components/settings/ClinicSection'
import TreatmentSection from '../components/settings/TreatmentSection'
import OnlineBookingSection from '../components/settings/OnlineBookingSection'
import type { ClinicSettings } from '../types'

interface DocProfile {
  specialization: string
  medical_council_number: string
}

export default function PanelSettings() {
  const { user } = useAuth()
  const [clinic, setClinic] = useState<ClinicSettings>({ id: null, clinic_name: '', logo: null, address: '', phone: '', phone2: '', phone3: '09001577080' } as any)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [docProfile, setDocProfile] = useState<DocProfile>({ specialization: '', medical_council_number: '' })
  const [treatments, setTreatments] = useState<any[]>([])

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
  }, [user])

  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold text-slate-800">تنظیمات پنل</h1>

      <ClinicSection
        clinic={clinic}
        setClinic={setClinic}
        logoFile={logoFile}
        setLogoFile={setLogoFile}
        user={user}
        docProfile={docProfile}
        setDocProfile={setDocProfile}
      />

      {isAdmin && <OnlineBookingSection treatments={treatments} onTreatmentsChange={setTreatments} />}

      <div className="flex items-center gap-3 mb-2">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-bold text-slate-400 tracking-wider">مدیریت سیستم</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {isAdmin && (
        <TreatmentSection treatments={treatments} setTreatments={setTreatments} />
      )}
    </div>
  )
}
