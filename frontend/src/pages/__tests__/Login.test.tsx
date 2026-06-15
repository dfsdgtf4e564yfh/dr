import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

vi.mock('../../services/api', () => ({
  login: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: { children?: React.ReactNode; to: string }) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../components/NeuralAnimation', () => ({
  default: () => null,
}))

vi.mock('../../components/NeuralPattern', () => ({
  default: () => null,
}))

import Login from '../Login'

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    render(<Login />)
    expect(screen.getByText('خوش آمدید')).toBeInTheDocument()
    expect(screen.getByText('ورود به سامانه')).toBeInTheDocument()
  })

  it('shows username and password fields', () => {
    render(<Login />)
    expect(screen.getByPlaceholderText('نام کاربری')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('رمز عبور')).toBeInTheDocument()
  })

  it('does not submit with empty fields', () => {
    render(<Login />)
    fireEvent.click(screen.getByText('ورود به سامانه'))
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('submits form with credentials on success', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    render(<Login />)

    fireEvent.change(screen.getByPlaceholderText('نام کاربری'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByPlaceholderText('رمز عبور'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByText('ورود به سامانه'))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'pass123')
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows forgot password link', () => {
    render(<Login />)
    expect(screen.getByText('رمز عبور را فراموش کرده‌اید؟')).toBeInTheDocument()
  })

  it('toggles password visibility', () => {
    render(<Login />)
    const passwordInput = screen.getByPlaceholderText('رمز عبور') as HTMLInputElement
    expect(passwordInput).toHaveAttribute('type', 'password')
    const toggleBtn = document.querySelectorAll('button')
    const showBtn = Array.from(toggleBtn).find(b => b.querySelector('svg'))
    if (showBtn) {
      fireEvent.click(showBtn)
      expect(passwordInput).toHaveAttribute('type', 'text')
    }
  })

  it('renders brand section on large screens', () => {
    render(<Login />)
    expect(screen.getByText('کلینیک تخصصی')).toBeInTheDocument()
    expect(screen.getByText('اعصاب و روان')).toBeInTheDocument()
  })
})
