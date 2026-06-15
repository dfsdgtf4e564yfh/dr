import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Users } from 'lucide-react'
import EmptyState from '../EmptyState'

describe('EmptyState', () => {
  it('renders default title', () => {
    render(<EmptyState />)
    expect(screen.getByText('داده‌ای وجود ندارد')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<EmptyState description="Try adding new data" />)
    expect(screen.getByText('Try adding new data')).toBeInTheDocument()
  })

  it('renders action element', () => {
    render(<EmptyState action={<button>Add New</button>} />)
    expect(screen.getByText('Add New')).toBeInTheDocument()
  })

  it('renders with variant SVG illustration', () => {
    const { container } = render(<EmptyState variant="search" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with custom icon', () => {
    render(<EmptyState icon={Users} title="No users" />)
    expect(screen.getByText('No users')).toBeInTheDocument()
  })

  it('renders with variant and no fallback icon', () => {
    const { container } = render(<EmptyState variant="patients" />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })
})
