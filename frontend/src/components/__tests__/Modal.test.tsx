import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Modal from '../Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={vi.fn()}><p>Content</p></Modal>)
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('renders content when open', () => {
    render(<Modal open={true} onClose={vi.fn()}><p>Content</p></Modal>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<Modal open={true} onClose={vi.fn()} title="My Title"><p>Content</p></Modal>)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose} title="Title"><p>Content</p></Modal>)
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/30')
    expect(backdrop).toBeTruthy()
    if (backdrop) fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when closable is false', () => {
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose} closable={false}><p>Content</p></Modal>)
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/30')
    expect(backdrop).toBeTruthy()
    if (backdrop) fireEvent.click(backdrop)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders close button when closable is true', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Title"><p>Content</p></Modal>)
    const closeBtn = document.querySelector('button')
    expect(closeBtn).toBeInTheDocument()
  })

  it('does not render close button when closable is false', () => {
    render(<Modal open={true} onClose={vi.fn()} closable={false} title="Title"><p>Content</p></Modal>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('applies size class', () => {
    render(<Modal open={true} size="md" onClose={vi.fn()}><p>Content</p></Modal>)
    const modalPanel = document.querySelector('.max-w-2xl')
    expect(modalPanel).toBeInTheDocument()
  })

  it('stops propagation on inner click', () => {
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>)
    const content = screen.getByText('Content')
    fireEvent.click(content)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders without title', () => {
    render(<Modal open={true} onClose={vi.fn()}><p>Content</p></Modal>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
