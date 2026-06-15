import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Input from '../Input'

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders label', () => {
    render(<Input label="Username" />)
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  it('renders required asterisk', () => {
    render(<Input label="Username" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('renders success message', () => {
    render(<Input success="Looks good" />)
    expect(screen.getByText('Looks good')).toBeInTheDocument()
  })

  it('renders hint', () => {
    render(<Input hint="Enter your name" />)
    expect(screen.getByText('Enter your name')).toBeInTheDocument()
  })

  it('shows error over success', () => {
    render(<Input error="Error" success="Success" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.queryByText('Success')).not.toBeInTheDocument()
  })

  it('shows hint only when no error or success', () => {
    render(<Input hint="Hint" />)
    expect(screen.getByText('Hint')).toBeInTheDocument()
  })

  it('toggles password visibility', () => {
    const { container } = render(<Input type="password" />)
    const toggleBtn = screen.getByRole('button')
    const input = container.querySelector('input')
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(toggleBtn)
    expect(input).toHaveAttribute('type', 'text')
  })

  it('renders icon', () => {
    const Icon = () => <svg data-testid="input-icon" />
    render(<Input icon={Icon} />)
    expect(screen.getByTestId('input-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    expect(screen.getByRole('textbox').className).toContain('custom-input')
  })

  it('applies size class', () => {
    render(<Input size="lg" />)
    expect(screen.getByRole('textbox').className).toContain('py-3.5')
  })

  it('sets dir attribute for tel type', () => {
    render(<Input type="tel" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('dir', 'ltr')
  })

  it('sets readOnly styles when readOnly', () => {
    render(<Input readOnly />)
    expect(screen.getByRole('textbox').className).toContain('cursor-default')
  })

  it('calls onFocus and onBlur', () => {
    render(<Input label="Test" />)
    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    fireEvent.blur(input)
  })

  it('forwards ref', () => {
    const ref = vi.fn()
    render(<Input ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })
})
