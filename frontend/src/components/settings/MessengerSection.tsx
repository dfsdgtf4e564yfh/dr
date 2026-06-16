import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { MessageSquare, Send, Save, RefreshCw } from 'lucide-react'
import { getMessengerSettings, updateMessengerSettings, testMessenger } from '../../services/api'
import Button from '../Button'
import type { MessengerSetting } from '../../types'

type MessengerType = 'bale' | 'rubika' | 'eitaa' | 'telegram'

const MESSENGER_INFO: Record<string, { label: string; color: string }> = {
  bale: { label: 'بله', color: 'text-blue-600' },
  rubika: { label: 'روبیکا', color: 'text-purple-600' },
  eitaa: { label: 'ایتا', color: 'text-emerald-600' },
  telegram: { label: 'تلگرام', color: 'text-sky-600' },
}

export default function MessengerSection() {
  const [settings, setSettings] = useState<MessengerSetting[]>([])
  const [testing, setTesting] = useState<MessengerType | null>(null)
  const [saving, setSaving] = useState<MessengerType | null>(null)

  useEffect(() => {
    getMessengerSettings().then(({ data }) => {
      setSettings(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [])

  const getMessengerLabel = (type: string): string => {
    return (MESSENGER_INFO[type] || {}).label || type || 'پیام‌رسان'
  }

  const handleToggle = async (item: MessengerSetting) => {
    const updated = { ...item, is_active: !item.is_active }
    setSaving(item.messenger_type as MessengerType)
    try {
      await updateMessengerSettings(updated)
      setSettings(prev => prev.map(s => s.messenger_type === item.messenger_type ? { ...s, is_active: !s.is_active } : s))
      toast.success(`وضعیت ${getMessengerLabel(item.messenger_type)} تغییر کرد`)
    } catch {
      toast.error('خطا در ذخیره تنظیمات')
    } finally {
      setSaving(null)
    }
  }

  const handleSave = async (item: MessengerSetting) => {
    setSaving(item.messenger_type as MessengerType)
    try {
      await updateMessengerSettings(item)
      toast.success(`تنظیمات ${getMessengerLabel(item.messenger_type)} ذخیره شد`)
    } catch {
      toast.error('خطا در ذخیره تنظیمات')
    } finally {
      setSaving(null)
    }
  }

  const handleTest = async (item: MessengerSetting) => {
    setTesting(item.messenger_type as MessengerType)
    try {
      const { data } = await testMessenger({ messenger_type: item.messenger_type, bot_token: item.bot_token })
      if ((data as any).success) {
        toast.success(`اتصال ${getMessengerLabel(item.messenger_type)} برقرار شد`)
      } else {
        toast.error((data as any).error || 'خطا در اتصال')
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'عدم امکان اتصال'
      toast.error(msg)
    } finally {
      setTesting(null)
    }
  }

  const updateField = (type: MessengerType, field: string, value: string) => {
    setSettings(prev => prev.map(s => s.messenger_type === type ? { ...s, [field]: value } : s))
  }

  return (
    <div className="panel card-iranian">
      <div className="panel-header panel-header-iranian">
        <h3 className="flex items-center gap-2"><MessageSquare size={18} className="text-brand-500" /> پیام‌رسان‌ها</h3>
      </div>
      <div className="panel-body space-y-4">
        <p className="text-sm text-slate-500">
          اتصال به پیام‌رسان‌های ایرانی برای ارسال اعلان به بیماران
        </p>
        {settings.length === 0 ? (
          <p className="text-sm text-slate-400">در حال بارگذاری...</p>
        ) : (
          settings.map((item) => {
            const info = MESSENGER_INFO[item.messenger_type] || { label: item.messenger_type || 'پیام‌رسان', color: 'text-slate-600' }
            return (
              <div key={item.messenger_type} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={20} className={info.color} />
                    <span className={`font-bold ${info.color}`}>{info.label}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={item.is_active}
                      onChange={() => handleToggle(item)}
                      disabled={saving === item.messenger_type}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500" />
                    <span className="mr-3 text-sm text-slate-600">{item.is_active ? 'فعال' : 'غیرفعال'}</span>
                  </label>
                </div>
                <div className="form-grid">
                  <div>
                    <label className="label">توکن ربات</label>
                    <input
                      className="input-field ltr"
                      type="password"
                      value={item.bot_token}
                      onChange={e => updateField(item.messenger_type as MessengerType, 'bot_token', e.target.value)}
                      placeholder="توکن ربات خود را وارد کنید"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="label">شناسه کاربر/گروه پیش‌فرض</label>
                    <input
                      className="input-field ltr"
                      value={item.chat_id}
                      onChange={e => updateField(item.messenger_type as MessengerType, 'chat_id', e.target.value)}
                      placeholder="chat_id گیرنده"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" icon={Save} onClick={() => handleSave(item)} loading={saving === item.messenger_type}>ذخیره</Button>
                  <Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => handleTest(item)} loading={testing === item.messenger_type}>تست اتصال</Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
