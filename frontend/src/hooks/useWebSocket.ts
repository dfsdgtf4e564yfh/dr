import { useEffect, useRef, useCallback } from 'react'
import type { WebSocketMessage } from '../types'

const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY = 2000
const HEARTBEAT_INTERVAL = 30000

function getWebSocketUrl(): string {
  const apiBase = (window as any).APP_CONFIG?.API_BASE_URL
  if (apiBase) {
    try {
      const url = new URL(apiBase)
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${wsProtocol}//${url.host}/ws/appointments/`
    } catch { /* fallback to window.location */ }
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/appointments/`
}

export default function useWebSocket(onMessage: (msg: WebSocketMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const everOpened = useRef(false)
  const onMessageRef = useRef(onMessage)
  const intentionalClose = useRef(false)
  onMessageRef.current = onMessage

  const startHeartbeat = useCallback((ws: WebSocket) => {
    if (heartbeatTimeout.current) clearInterval(heartbeatTimeout.current)
    heartbeatTimeout.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, HEARTBEAT_INTERVAL)
  }, [])

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeout.current) {
      clearInterval(heartbeatTimeout.current)
      heartbeatTimeout.current = null
    }
  }, [])

  const connect = useCallback(() => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return

    const url = getWebSocketUrl()
    const ws = new WebSocket(url)
    wsRef.current = ws
    intentionalClose.current = false

    ws.onopen = () => {
      everOpened.current = true
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
        reconnectTimeout.current = null
      }
      reconnectAttempts.current = 0
      ws.send(JSON.stringify({ type: 'auth', token }))
      startHeartbeat(ws)
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        if (data.type === 'auth_required' || data.type === 'auth_failed') {
          return
        }
        if (onMessageRef.current) onMessageRef.current(data)
      } catch { /* ignore malformed messages */ }
    }

    ws.onclose = () => {
      stopHeartbeat()
      if (intentionalClose.current || !everOpened.current || reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return
      const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current), 30000)
      reconnectAttempts.current++
      reconnectTimeout.current = setTimeout(() => {
        reconnectTimeout.current = null
        connect()
      }, delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [startHeartbeat, stopHeartbeat])

  useEffect(() => {
    connect()
    return () => {
      intentionalClose.current = true
      reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS
      stopHeartbeat()
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect, stopHeartbeat])

  return wsRef
}
