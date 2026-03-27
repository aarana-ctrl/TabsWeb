import { motion } from 'framer-motion'
import { spring } from './motion'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      transition={spring.snap}
      className={`relative inline-flex items-center w-14 h-8 rounded-full transition-colors ${
        checked ? 'bg-tabs-green' : 'bg-[var(--card2)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.div
        layout
        transition={spring.snap}
        className="w-7 h-7 rounded-full bg-white shadow-lg"
        style={{
          marginLeft: checked ? '6px' : '3px',
        }}
      />
    </motion.button>
  )
}
