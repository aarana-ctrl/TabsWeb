import { motion } from 'framer-motion'
import { spring } from './motion'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  color?: string   // Tailwind bg class e.g. 'bg-tabs-green'
  fullWidth?: boolean
  loading?: boolean
  children: React.ReactNode
}

export function Button({ variant = 'primary', color, fullWidth, loading, children, className = '', ...rest }: Props) {
  const base = `relative flex items-center justify-center gap-2 rounded-pill px-6 py-[14px] text-[15px] font-semibold
    transition-opacity select-none disabled:opacity-40 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}`

  const styles: Record<string, string> = {
    primary:   color ?? 'bg-[var(--primary)] text-[var(--on-primary)]',
    secondary: 'bg-[var(--card)] text-[var(--primary)] border border-[color:var(--primary)]/15',
    ghost:     'bg-transparent text-[var(--primary)] hover:bg-[var(--card2)]',
    danger:    'bg-tabs-red text-white',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.965, filter: 'brightness(0.97)' }}
      transition={spring.snap}
      className={`${base} ${styles[variant]} ${className}`}
      disabled={loading || rest.disabled}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {loading
        ? <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        : children}
    </motion.button>
  )
}

/** Icon-only circular button */
export function IconButton({ children, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.90 }}
      transition={spring.snap}
      className={`w-9 h-9 flex items-center justify-center rounded-full bg-[var(--card2)] text-[var(--secondary)] ${className}`}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  )
}
