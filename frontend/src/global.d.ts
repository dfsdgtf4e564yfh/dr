/// <reference types="vite/client" />

import type { AppConfig } from './types'

declare global {
  interface Window {
    APP_CONFIG?: AppConfig
  }
}
