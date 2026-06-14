import { useState, useEffect } from 'react'
import { getPWAInstall } from '../main'

interface PWAInstallResult {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  install: () => Promise<void>
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
}

export default function usePWAInstall(): PWAInstallResult {
  const [isInstalled, setIsInstalled] = useState(false)
  const iosDevice = isIOS()

  useEffect(() => {
    const installed = (window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as any).standalone === true
    setIsInstalled(installed)
  }, [])

  useEffect(() => {
    const handler = () => setIsInstalled(true)
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

  const { isInstallable, install } = getPWAInstall()

  return { isInstallable, isInstalled, isIOS: iosDevice, install }
}
