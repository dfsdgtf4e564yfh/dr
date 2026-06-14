import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { first_name: 'John', last_name: 'Doe', role: 'admin' },
    hasRole: () => true,
    hasPermission: () => true,
  }),
}))

vi.mock('../../hooks/useWebSocket', () => ({
  default: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  getDashboardStats: vi.fn().mockResolvedValue({ data: { patients_this_month: 10, monthly_income: 5000000, pending_billings: 2000000, yearly_income: 60000000 } }),
  getMonthlyIncome: vi.fn().mockResolvedValue({ data: [] }),
  getDoctorIncomePie: vi.fn().mockResolvedValue({ data: [] }),
  getPatientsTrend: vi.fn().mockResolvedValue({ data: [] }),
  getAlerts: vi.fn().mockResolvedValue({ data: { unpaid_billings: [], today_appointments: [] } }),
  getWorkYearInfo: vi.fn().mockResolvedValue({ data: { jalali_year: 1403, patients_count: 500, appointments_count: 1500, total_income: 100000000, total_paid: 80000000 } }),
}))

vi.mock('../../utils/apiError', () => ({
  handleApiError: vi.fn(),
}))

vi.mock('../../components/Skeleton', () => ({
  SkeletonCard: () => <div data-testid="skeleton-card" />,
  SkeletonChart: () => <div data-testid="skeleton-chart" />,
}))

vi.mock('../../components/PersianDecoration', () => ({
  KhatamBorder: ({ className }: { className?: string }) => <div data-testid="khatam" className={className} />,
}))

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  AreaChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
}))

vi.mock('lucide-react', () => ({
  Users: () => <svg data-testid="lucide-users" />,
  Calendar: () => <svg data-testid="lucide-calendar" />,
  DollarSign: () => <svg data-testid="lucide-dollar" />,
  TrendingUp: () => <svg data-testid="lucide-trending-up" />,
  Activity: () => <svg data-testid="lucide-activity" />,
  UserPlus: () => <svg data-testid="lucide-user-plus" />,
  Clock: () => <svg data-testid="lucide-clock" />,
  TrendingDown: () => <svg data-testid="lucide-trending-down" />,
  Stethoscope: () => <svg data-testid="lucide-stethoscope" />,
  Wallet: () => <svg data-testid="lucide-wallet" />,
  Settings: () => <svg data-testid="lucide-settings" />,
}))

import Dashboard from '../Dashboard'

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<Dashboard />)
    expect(screen.getByTestId('skeleton-card')).toBeInTheDocument()
  })

  it('renders dashboard content after loading', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText(/خوش‌آمدید/)).toBeInTheDocument()
    })
  })

  it('renders patient stats widget', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText('بیماران جدید (ماه)')).toBeInTheDocument()
    })
  })

  it('renders income stats widget', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText('درآمد ماهانه')).toBeInTheDocument()
    })
  })

  it('renders billing stats widget', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText('صورتحساب معوق')).toBeInTheDocument()
    })
  })

  it('renders alert section', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText('هشدارها')).toBeInTheDocument()
    })
  })

  it('renders chart section', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })
  })

  it('renders work year info section', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText(/سال کاری/)).toBeInTheDocument()
    })
  })

  it('renders trend chart', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })
})
