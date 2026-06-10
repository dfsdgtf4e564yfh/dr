import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'primary'
  loading?: boolean
}

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'تأیید عملیات', message = 'آیا از انجام این عملیات اطمینان دارید؟', confirmLabel = 'تأیید', cancelLabel = 'انصراف', variant = 'danger', loading = false }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center py-2">
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
          variant === 'danger' ? 'bg-red-50 text-red-500' :
          variant === 'warning' ? 'bg-amber-50 text-amber-500' :
          'bg-brand-50 text-brand-500'
        }`}>
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={variant === 'warning' ? 'gradientAmber' : variant} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}
