import { motion } from 'framer-motion'
import { spring, fadeUp } from './motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: string
}

export function Card({ children, className = '', onClick, padding = 'p-5' }: CardProps) {
  if (onClick) {
    return (
      <motion.div
        whileTap={{ scale: 0.975, filter: 'brightness(0.97)' }}
        transition={spring.snap}
        onClick={onClick}
        className={`bg-[var(--card)] rounded-card shadow-card dark:shadow-card-dark cursor-pointer ${padding} ${className}`}
      >
        {children}
      </motion.div>
    )
  }
  return (
    <div className={`bg-[var(--card)] rounded-card shadow-card dark:shadow-card-dark ${padding} ${className}`}>
      {children}
    </div>
  )
}

/** Animated card that fades-up on mount */
export function AnimatedCard({ children, className = '', delay = 0, ...rest }: CardProps & { delay?: number }) {
  return (
    <motion.div
      initial={fadeUp.initial}
      animate={fadeUp.animate}
      exit={fadeUp.exit}
      transition={{ ...fadeUp.transition, delay }}
      className={`bg-[var(--card)] rounded-card shadow-card dark:shadow-card-dark p-5 ${className}`}
      {...(rest.onClick ? {
        whileTap: { scale: 0.975, filter: 'brightness(0.97)' },
        onClick: rest.onClick,
      } : {})}
    >
      {children}
    </motion.div>
  )
}
