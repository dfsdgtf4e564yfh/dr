import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { Clock } from 'lucide-react'
import { login as apiLogin, getMe } from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  login: (username: string, password: string, otpCode?: string) => Promise<void>
  logout: () => void
  loading: boolean
  hasRole: (...roles: string[]) => boolean
  hasPermission: (codename: string) => boolean
  loadUser: () => Promise<void>
  setUser: (user: User | null) => void
}

const INACTIVITY_TIMEOUT = 30 * 60 * 1000
const WARNING_DURATION = 30 * 1000

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [inactivityWarning, setInactivityWarning] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearInactivityTimers = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (countdownInterval.current) clearInterval(countdownInterval.current)
    setInactivityWarning(false)
    setCountdown(0)
  }

  const logout = useCallback(() => {
    clearInactivityTimers()
    sessionStorage.clear()
    setUser(null)
  }, [])

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimers()
    inactivityTimer.current = setTimeout(() => {
      setInactivityWarning(true)
      setCountdown(WARNING_DURATION / 1000)
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            logout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, INACTIVITY_TIMEOUT)
  }, [logout])

  useEffect(() => {
    if (!user) return
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'click']
    const handler = () => {
      clearInactivityTimers()
      startInactivityTimer()
    }
    events.forEach(e => document.addEventListener(e, handler))
    startInactivityTimer()
    return () => {
      events.forEach(e => document.removeEventListener(e, handler))
      clearInactivityTimers()
    }
  }, [user, startInactivityTimer])

  const loadUser = useCallback(async () => {
    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await getMe()
      setUser(data)
    } catch {
      sessionStorage.clear()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (username: string, password: string, otpCode?: string) => {
    const { data } = await apiLogin(username, password, otpCode)
    if ((data as any).requires_2fa) {
      throw { response: { data } }
    }
    sessionStorage.setItem('access_token', data.access)
    sessionStorage.setItem('refresh_token', data.refresh)
    await loadUser()
  }

  const hasRole = (...roles: string[]) => user && roles.includes(user.role)

  const hasPermission = (codename: string) => {
    if (!user) return false
    if (user.role === 'admin' || user.role === 'super_support' || user.role === 'support') return true
    if (!user.page_permissions) return false
    return user.page_permissions.includes(codename)
  }

  const dismissWarning = () => {
    clearInactivityTimers()
    startInactivityTimer()
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole, hasPermission, loadUser, setUser }}>
      {children}
      {inactivityWarning && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">هشدار عدم فعالیت</h3>
            <p className="text-sm text-slate-500 mb-2">
              به دلیل عدم فعالیت، به زودی از سیستم خارج می‌شوید.
            </p>
            <p className="text-2xl font-bold text-amber-600 mb-4 ltr" dir="ltr">
              {countdown} ثانیه
            </p>
            <button onClick={dismissWarning}
              className="w-full py-3 bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold rounded-2xl">
              من فعال هستم
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
