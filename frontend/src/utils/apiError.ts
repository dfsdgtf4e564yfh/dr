import { toast } from 'react-toastify'

const englishToPersianErrors: Record<string, string> = {
  'Request aborted': 'درخواست لغو شد',
  'Network Error': 'خطای شبکه',
  'timeout': 'مدت زمان درخواست به پایان رسید',
  'canceled': 'درخواست لغو شد',
  'Failed to fetch': 'خطا در برقراری ارتباط با سرور',
}

function translateErrorMessage(message: string): string {
  for (const [en, fa] of Object.entries(englishToPersianErrors)) {
    if (message.toLowerCase().includes(en.toLowerCase())) return fa
  }
  return message
}

export function handleApiError(err: any, fallback = 'خطایی رخ داد'): string | undefined {
  const resp = err?.response?.data
  if (!resp) {
    toast.error(translateErrorMessage(err?.message || fallback))
    return
  }

  if (typeof resp === 'string') {
    toast.error(resp)
    return
  }

  if (resp.detail) {
    toast.error(resp.detail)
    return
  }

  if (resp.error) {
    toast.error(resp.error)
    return
  }

  if (typeof resp === 'object') {
    const firstKey = Object.keys(resp)[0]
    const firstError = resp[firstKey]
    const message = Array.isArray(firstError) ? firstError[0] : typeof firstError === 'string' ? firstError : null
    if (message) {
      toast.error(message)
      return firstKey
    }
  }

  toast.error(fallback)
}
