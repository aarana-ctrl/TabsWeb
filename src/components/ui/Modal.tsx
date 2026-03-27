// Modal / Sheet — responsive:
//  • Mobile: slides up from bottom (sheet style, matching iOS sheets)
//  • Desktop: centered dialog
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { spring } from './motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Sheet (mobile) */}
          <motion.div
            key="sheet-mobile"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring.fluid}
            className={`fixed inset-x-0 bottom-0 z-50 rounded-t-sheet bg-[var(--bg)] max-h-[92dvh] overflow-y-auto no-scrollbar
              md:hidden`}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-[4px] rounded-full bg-[var(--secondary)]/30" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-6 py-3">
                <h2 className="text-[20px] font-semibold text-[var(--primary)] font-display">{title}</h2>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card2)] text-[var(--secondary)]">
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}
            <div className="px-6 pb-8">{children}</div>
          </motion.div>

          {/* Dialog (desktop ≥ md) */}
          <motion.div
            key="dialog-desktop"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={spring.fluid}
            className={`fixed z-50 hidden md:flex flex-col inset-x-0 top-1/2 -translate-y-1/2 mx-auto
              ${maxW} w-full bg-[var(--bg)] rounded-sheet shadow-2xl max-h-[90dvh] overflow-y-auto no-scrollbar`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h2 className="text-[22px] font-semibold text-[var(--primary)] font-display">{title}</h2>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card2)] text-[var(--secondary)]">
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}
            <div className="px-6 pb-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
