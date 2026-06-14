import { useState, useEffect } from 'react'
import { getSmsTemplates } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import SmsSection from '../components/settings/SmsSection'
import MessengerSection from '../components/settings/MessengerSection'
import ProfileSection from '../components/settings/ProfileSection'
import type { SmsTemplate } from '../types'

interface SmsSettingsModal {
  visible: boolean
  mode: string
}

export default function Settings() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  const [smsSettingsModal, setSmsSettingsModal] = useState<SmsSettingsModal>({ visible: false, mode: 'send' })

  useEffect(() => {
    getSmsTemplates().then((res) => { const d = res.data as any; setTemplates(Array.isArray(d) ? d : d.results || []) }).catch(() => setTemplates([]))
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold text-slate-800">تنظیمات</h1>

      {isAdmin && (
        <>
          <SmsSection
            templates={templates}
            setTemplates={setTemplates}
            setSmsSettingsModal={setSmsSettingsModal}
          />
          <MessengerSection />
        </>
      )}

      <ProfileSection user={user} setUser={() => {}} />
    </div>
  )
}
