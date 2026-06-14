import { useEffect, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15 } },
} as const

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 18, filter: 'blur(4px)' },
  visible: {
    opacity: 1, scale: 1, y: 0, filter: 'blur(0px)',
    transition: { type: 'spring' as const, damping: 26, stiffness: 320, mass: 0.75 },
  },
  exit: { opacity: 0, scale: 0.96, y: 8, filter: 'blur(2px)', transition: { duration: 0.13 } },
} as const

export default function Modal({ open, onClose, title, children, className = '', size = 'md', closable = true }: ModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const sizes: Record<string, string> = {
    xs: 'max-w-sm', sm: 'max-w-md', md: 'max-w-2xl',
    lg: 'max-w-4xl', xl: 'max-w-6xl', full: 'max-w-full mx-4',
  }

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 sm:pt-12 overflow-y-auto">
          <motion.div
            className="fixed inset-0 bg-black/35 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden" animate="visible" exit="exit"
            onClick={closable ? onClose : undefined}
          />
          <motion.div
            className={`relative bg-white rounded-2xl w-full ${sizes[size] || sizes.md} shadow-soft-lg modal-iranian overflow-hidden ${className}`}
            variants={modalVariants}
            initial="hidden" animate="visible" exit="exit"
            onClick={e => e.stopPropagation()}
          >
            {title && (
              <div
                className="flex items-center justify-between px-6 pt-5 pb-4 panel-header-iranian"
                style={{borderBottom: '1px solid rgba(26,74,138,0.08)'}}
              >
                <div className="flex items-center gap-2">
                  {/* نقطه تزئینی فیروزه ای */}
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--persian-firuzeh), var(--persian-lajvard-light))',
                    boxShadow: '0 0 6px rgba(42,179,184,0.4)',
                    display: 'inline-block',
                  }} />
                  <h3 className="text-base font-bold text-surface-800">{title}</h3>
                </div>
                {closable && (
                  <motion.button
                    whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06 }}
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-surface-400 hover:bg-rose-50 hover:text-rose-500 transition-all -mr-1"
                  >
                    <X size={16} />
                  </motion.button>
                )}
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
