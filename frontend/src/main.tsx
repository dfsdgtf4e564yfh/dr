import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

async function bootstrap() {
  window.APP_CONFIG = window.APP_CONFIG || {}
  try {
    const res = await fetch('/api/config/')
    if (res.ok) {
      const data = await res.json()
      window.APP_CONFIG = { ...window.APP_CONFIG, ...data }
      document.title = data.app_title || document.title
      if (data.favicon) {
        let link = document.querySelector('link[rel="icon"]')
        if (link) (link as HTMLLinkElement).href = data.favicon
      }
      if (data.primary_color) {
        document.documentElement.style.setProperty('--color-primary', data.primary_color)
      }
      if (data.secondary_color) {
        document.documentElement.style.setProperty('--color-secondary', data.secondary_color)
      }
    }
  } catch {
    console.warn('Failed to load config from server, using defaults')
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
              window.location.reload()
            }
          })
        }
      })
    } catch {
      console.warn('SW registration failed:')
    }
  }

  document.addEventListener('touchstart', () => {}, { passive: true })

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

bootstrap()
