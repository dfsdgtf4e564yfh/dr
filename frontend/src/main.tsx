import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

let deferredPWAInstall: any = null
let pwaInstallable = false

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPWAInstall = e
  pwaInstallable = true
}, { once: true })

window.addEventListener('appinstalled', () => {
  pwaInstallable = false
  deferredPWAInstall = null
})

export function getPWAInstall() {
  return {
    isInstallable: pwaInstallable && !!deferredPWAInstall,
    install: async () => {
      if (!deferredPWAInstall) return
      deferredPWAInstall.prompt()
      const result = await deferredPWAInstall.userChoice
      if (result.outcome === 'accepted') {
        pwaInstallable = false
        deferredPWAInstall = null
      }
    }
  }
}

function bootstrap() {
  window.APP_CONFIG = window.APP_CONFIG || {}

  fetch('/api/config/').then(res => {
    if (!res.ok) return
    res.json().then(data => {
      window.APP_CONFIG = { ...window.APP_CONFIG, ...data }
      if (data.app_title) document.title = data.app_title
      if (data.favicon) {
        const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
        if (link) link.href = data.favicon
      }
      if (data.primary_color) {
        document.documentElement.style.setProperty('--color-primary', data.primary_color)
      }
      if (data.secondary_color) {
        document.documentElement.style.setProperty('--color-secondary', data.secondary_color)
      }
    })
  }).catch(() => {})

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }

  document.addEventListener('touchstart', () => {}, { passive: true })

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

bootstrap()
