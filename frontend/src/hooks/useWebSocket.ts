import { useEffect, useRef, useCallback } from 'react'
import type { WebSocketMessage } from '../types'

export default function useWebSocket(onMessage: (msg: WebSocketMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/ws/appointments/?token=${token}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
        reconnectTimeout.current = null
      }
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        if (onMessageRef.current) onMessageRef.current(data)
      } catch { /* ignore malformed messages */ }
    }

    ws.onclose = () => {
      if (reconnectTimeout.current) return
      reconnectTimeout.current = setTimeout(() => {
        reconnectTimeout.current = null
        connect()
      }, 5000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  return wsRef
}
