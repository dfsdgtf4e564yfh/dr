import { toast } from 'react-toastify'

export function handleApiError(err: any, fallback = 'خطایی رخ داد'): string | undefined {
  const resp = err?.response?.data
  if (!resp) {
    toast.error(err?.message || fallback)
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
