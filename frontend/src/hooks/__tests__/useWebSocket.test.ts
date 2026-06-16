import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useWebSocket from '../useWebSocket'

const storage: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { storage[key] = String(value) }),
  clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]) }),
  removeItem: vi.fn((key: string) => { delete storage[key] }),
  get length() { return Object.keys(storage).length },
  key: vi.fn((i: number) => Object.keys(storage)[i] ?? null),
} satisfies Storage

describe('useWebSocket', () => {
  let mockWs: { close: ReturnType<typeof vi.fn>; addEventListener: ReturnType<typeof vi.fn>; readyState: number; onopen?: () => void; onmessage?: (e: MessageEvent) => void; onerror?: () => void }
  let MockWebSocket: ReturnType<typeof vi.fn>

  beforeEach(() => {
    storage.access_token = 'test-token'
    mockWs = { close: vi.fn(), addEventListener: vi.fn(), readyState: 1 }
    MockWebSocket = vi.fn(function (this: WebSocket, _url: string | URL) { return mockWs as unknown as WebSocket })
    vi.stubGlobal('localStorage', localStorageMock)
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    delete storage.access_token
    vi.unstubAllGlobals()
  })

  it('creates WebSocket connection with token', () => {
    renderHook(() => useWebSocket(vi.fn()))
    expect(MockWebSocket).toHaveBeenCalledWith(
      expect.stringContaining('token=test-token')
    )
  })

  it('does not connect without token', () => {
    delete storage.access_token
    renderHook(() => useWebSocket(vi.fn()))
    expect(MockWebSocket).not.toHaveBeenCalled()
  })

  it('calls onMessage when message received', () => {
    const onMessage = vi.fn()
    const mockData = { type: 'appointment_update', id: 1 }
    renderHook(() => useWebSocket(onMessage))
    act(() => { mockWs.onopen?.() })
    act(() => { mockWs.onmessage?.({ data: JSON.stringify(mockData) } as MessageEvent) })
    expect(onMessage).toHaveBeenCalledWith(mockData)
  })

  it('ignores malformed JSON messages', () => {
    const onMessage = vi.fn()
    renderHook(() => useWebSocket(onMessage))
    act(() => { mockWs.onmessage?.({ data: 'not-json' } as MessageEvent) })
    expect(onMessage).not.toHaveBeenCalled()
  })

  it('closes connection on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket(vi.fn()))
    unmount()
    expect(mockWs.close).toHaveBeenCalled()
  })

  it('closes connection on error', () => {
    renderHook(() => useWebSocket(vi.fn()))
    act(() => { mockWs.onerror?.() })
    expect(mockWs.close).toHaveBeenCalled()
  })

  it('returns ws ref', () => {
    const { result } = renderHook(() => useWebSocket(vi.fn()))
    expect(result.current.current).toBeDefined()
  })
})
