import { useEffect, useRef, useCallback } from 'react'
import type { WebSocketMessage } from '../types'

const MAX_RECONNECT_ATTEMPTS = 3
const BASE_RECONNECT_DELAY = 2000

export default function useWebSocket(onMessage: (msg: WebSocketMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttempts = useRef(0)
  const everOpened = useRef(false)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/ws/appointments/`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      everOpened.current = true
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
        reconnectTimeout.current = null
      }
      reconnectAttempts.current = 0
      ws.send(JSON.stringify({ type: 'auth', token }))
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
      if (!everOpened.current || reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return
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
  }, [])

  useEffect(() => {
    connect()
    return () => {
      reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  return wsRef
}
