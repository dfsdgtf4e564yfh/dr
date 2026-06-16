import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../services/api', () => ({
  getPatients: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
  createPatient: vi.fn(),
  updatePatient: vi.fn(),
  deletePatient: vi.fn(),
  searchPatients: vi.fn().mockResolvedValue({ data: [] }),
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    hasRole: () => true,
    hasPermission: () => true,
  }),
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('../../components/JalaliDateInput', () => ({
  default: ({ label, value, onChange, error }: { label?: string; value?: string; onChange?: (v: string) => void; error?: string }) => (
    <div>
      <label>{label}</label>
      <input
        data-testid="jalali-date-input"
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
      />
      {error && <span>{error}</span>}
    </div>
  ),
}))

vi.mock('../../components/Skeleton', () => ({
  SkeletonTable: () => <div data-testid="skeleton-table" />,
}))

vi.mock('../../components/Modal', () => ({
  default: ({ open, title, children, onClose }: { open: boolean; title?: string; children?: React.ReactNode; onClose?: () => void }) => open ? (
    <div data-testid="modal">
      <h2>{title}</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  ) : null,
}))

vi.mock('../../components/PageHeader', () => ({
  default: ({ title, children }: { title?: string; children?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

vi.mock('../../components/ConfirmDialog', () => ({
  default: ({ open, onConfirm, onClose, title, message }: { open: boolean; onConfirm?: () => void; onClose?: () => void; title?: string; message?: string }) => open ? (
    <div data-testid="confirm-dialog">
      <h3>{title}</h3>
      <p>{message}</p>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  ) : null,
}))

import Patients from '../Patients'

describe('Patients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<Patients />)
    expect(screen.getByTestId('skeleton-table')).toBeInTheDocument()
  })

  it('renders empty state when no patients', async () => {
    render(<Patients />)
    await waitFor(() => {
      expect(screen.getByText('بیماری یافت نشد')).toBeInTheDocument()
    })
  })

  it('renders page title', () => {
    render(<Patients />)
    expect(screen.getByText('مدیریت بیماران')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<Patients />)
    expect(screen.getByPlaceholderText('جستجو بر اساس نام، کد ملی، تلفن، شماره پرونده...')).toBeInTheDocument()
  })

  it('renders field selector', () => {
    render(<Patients />)
    expect(screen.getByText('همه فیلدها')).toBeInTheDocument()
  })

  it('shows add patient button', async () => {
    render(<Patients />)
    await waitFor(() => {
      expect(screen.getByText('بیمار جدید')).toBeInTheDocument()
    })
  })

  it('opens modal when clicking new patient', async () => {
    render(<Patients />)
    await waitFor(() => {
      const newBtn = screen.getByText('بیمار جدید')
      fireEvent.click(newBtn)
      expect(screen.getByTestId('modal')).toBeInTheDocument()
    })
  })

  it('renders empty state with action to add first patient', async () => {
    render(<Patients />)
    await waitFor(() => {
      expect(screen.getByText('ثبت اولین بیمار')).toBeInTheDocument()
    })
  })

  it('renders filter button', async () => {
    render(<Patients />)
    await waitFor(() => {
      const filterBtn = document.querySelector('button[type="button"]')
      expect(filterBtn).toBeInTheDocument()
    })
  })

  it('renders search button', async () => {
    render(<Patients />)
    await waitFor(() => {
      expect(screen.getByText('جستجو')).toBeInTheDocument()
    })
  })
})
