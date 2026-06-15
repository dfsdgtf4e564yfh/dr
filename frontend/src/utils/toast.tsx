import { toast } from 'react-toastify'
import { Undo2 } from 'lucide-react'

export function undoToast(message: string, onUndo: () => void, duration = 5000) {
  toast(
    ({ closeToast }: { closeToast: () => void }) => (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={() => { onUndo(); closeToast() }}
          className="flex items-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1.5 rounded-lg hover:bg-brand-100 transition-colors"
        >
          <Undo2 size={12} />
          بازگردانی
        </button>
      </div>
    ),
    {
      autoClose: duration,
      closeOnClick: false,
      pauseOnHover: true,
    }
  )
}
