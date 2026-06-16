import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

import useKeyboardShortcuts from '../useKeyboardShortcuts'

function fireKey(key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true })
  document.dispatchEvent(event)
  return event
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('navigates to dashboard on g + d', () => {
    renderHook(() => useKeyboardShortcuts())
    fireKey('g')
    fireKey('d')
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('navigates to patients on g + p', () => {
    renderHook(() => useKeyboardShortcuts())
    fireKey('g')
    fireKey('p')
    expect(mockNavigate).toHaveBeenCalledWith('/patients')
  })

  it('navigates to appointments on g + a', () => {
    renderHook(() => useKeyboardShortcuts())
    fireKey('g')
    fireKey('a')
    expect(mockNavigate).toHaveBeenCalledWith('/appointments')
  })

  it('navigates to settings on g + s', () => {
    renderHook(() => useKeyboardShortcuts())
    fireKey('g')
    fireKey('s')
    expect(mockNavigate).toHaveBeenCalledWith('/settings')
  })

  it('ignores shortcuts when inside input', () => {
    renderHook(() => useKeyboardShortcuts())
    const input = document.createElement('input')
    document.body.appendChild(input)
    const event = new KeyboardEvent('keydown', {
      key: 'g',
      bubbles: true,
    })
    Object.defineProperty(event, 'target', { value: input })
    document.dispatchEvent(event)

    const event2 = new KeyboardEvent('keydown', {
      key: 'd',
      bubbles: true,
    })
    Object.defineProperty(event2, 'target', { value: input })
    document.dispatchEvent(event2)

    expect(mockNavigate).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('ignores shortcuts when ctrl is pressed', () => {
    renderHook(() => useKeyboardShortcuts())
    const event = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true, bubbles: true })
    document.dispatchEvent(event)
    const event2 = new KeyboardEvent('keydown', { key: 'd', bubbles: true })
    document.dispatchEvent(event2)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('returns SHORTCUTS array', () => {
    const { result } = renderHook(() => useKeyboardShortcuts())
    expect(Array.isArray(result.current)).toBe(true)
    expect(result.current.length).toBeGreaterThan(0)
  })

  it('cleans up event listener on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardShortcuts())
    unmount()
    fireKey('g')
    fireKey('d')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('resets buffer after timeout', () => {
    vi.useFakeTimers()
    renderHook(() => useKeyboardShortcuts())
    fireKey('g')
    act(() => { vi.advanceTimersByTime(1100) })
    fireKey('d')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('handles three-key sequences by keeping last two', () => {
    renderHook(() => useKeyboardShortcuts())
    fireKey('g')
    fireKey('g')
    fireKey('d')
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })
})
