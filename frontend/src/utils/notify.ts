import { toast } from 'react-toastify'
import { createNotification } from '../services/api'

interface NotifyOptions {
  type?: 'success' | 'error' | 'warning' | 'info'
  sendNotification?: boolean
  detail?: string
  relatedType?: string
  relatedId?: number | null
}

export function notify(message: string, options: NotifyOptions = {}) {
  const { type = 'success' } = options

  if (type === 'error') toast.error(message)
  else if (type === 'warning') toast.warning(message)
  else if (type === 'info') toast.info(message)
  else toast.success(message)

  if (options.sendNotification) {
    createNotification({
      title: message,
      message: options.detail || message,
      is_read: false,
    }).catch(() => {})
  }
}
