import { Smartphone, Share2, Plus, Check } from 'lucide-react'
import Modal from './Modal'

interface Props {
  open: boolean
  onClose: () => void
}

const steps = [
  { icon: Share2, label: 'دکمه Share را در Safari بزنید', sub: 'مربع با فلش بالا — پایین صفحه' },
  { icon: Plus, label: 'Add to Home Screen را انتخاب کنید', sub: 'گزینه «افزودن به صفحه اصلی»' },
  { icon: Check, label: 'روی Add بزنید', sub: 'نام: کلینیک دکتر محمد طاهری' },
]

export default function IosInstallGuide({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="نصب برنامه (iOS)" size="sm">
      <div className="space-y-5">
        <p className="text-sm text-surface-500 leading-relaxed">
          برای نصب برنامه روی iPhone یا iPad، مراحل زیر را در مرورگر Safari دنبال کنید:
        </p>
        {steps.map(({ icon: Icon, label, sub }, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={15} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-800">{i + 1}. {label}</p>
              <p className="text-xs text-surface-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
        <div className="bg-amber-50 text-amber-700 text-xs rounded-xl p-3 leading-relaxed">
          <strong>توجه:</strong> حتماً از Safari استفاده کنید. مرورگرهای دیگر روی iOS از نصب PWA پشتیبانی نمی‌کنند.
        </div>
        <button onClick={onClose} className="btn-primary w-full text-sm py-2.5">
          متوجه شدم
        </button>
      </div>
    </Modal>
  )
}
