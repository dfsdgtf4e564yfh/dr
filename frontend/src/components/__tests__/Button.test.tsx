import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Button from '../Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('shows spinner when loading', () => {
    const { container } = render(<Button loading>Loading</Button>)
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
  })

  it('does not show children when loading and children present', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Submit')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders with icon', () => {
    const Icon = () => <svg data-testid="icon" />
    render(<Button icon={Icon}>With Icon</Button>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders iconOnly without children', () => {
    const Icon = () => <svg data-testid="icon" />
    render(<Button icon={Icon} iconOnly />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applies variant class', () => {
    render(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button').className).toContain('bg-rose-500')
  })

  it('applies size class', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button').className).toContain('px-7')
  })

  it('applies shape class', () => {
    render(<Button shape="pill">Pill</Button>)
    expect(screen.getByRole('button').className).toContain('rounded-full')
  })

  it('renders as submit type when specified', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('forwards custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByRole('button').className).toContain('custom-class')
  })
})
