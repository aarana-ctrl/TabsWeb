// Shared small components: Avatar, Badge, LoadingOverlay, EmptyState, SectionLabel
import { motion } from 'framer-motion'

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const letter = name.charAt(0).toUpperCase()
  const colors = ['#3DBF71','#5B8DEF','#E87B3A','#C86DD7','#E8B43A','#4CC9E0']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0 font-semibold text-white select-none"
      style={{ width: size, height: size, background: colors[idx], fontSize: size * 0.38 }}
    >
      {letter}
    </div>
  )
}

export function Badge({ children, color = 'default' }: { children: React.ReactNode; color?: 'green' | 'red' | 'orange' | 'gold' | 'default' }) {
  const map = {
    green:   'bg-tabs-green/12 text-tabs-green',
    red:     'bg-tabs-red/12 text-tabs-red',
    orange:  'bg-orange-500/12 text-orange-500',
    gold:    'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    default: 'bg-[var(--card2)] text-[var(--secondary)]',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-pill text-[12px] font-medium ${map[color]}`}>
      {children}
    </span>
  )
}

export function LiveDot() {
  return (
    <span className="flex items-center gap-1.5">
      <motion.span
        className="w-2 h-2 rounded-full bg-tabs-green"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      />
      <span className="text-[12px] font-medium text-tabs-green">Live</span>
    </span>
  )
}

export function LoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
    >
      <div className="glass rounded-[20px] w-20 h-20 flex items-center justify-center shadow-2xl">
        <div className="w-8 h-8 border-[3px] border-[var(--secondary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    </motion.div>
  )
}

export function Spinner({ size = 20, color = 'var(--primary)' }: { size?: number; color?: string }) {
  return (
    <div
      className="rounded-full border-[2.5px] border-[color:var(--card2)] animate-spin flex-shrink-0"
      style={{ width: size, height: size, borderTopColor: color }}
    />
  )
}

export function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 px-8 text-center">
      <div className="text-[var(--secondary)] opacity-60">{icon}</div>
      <p className="text-[18px] font-semibold text-[var(--primary)]">{title}</p>
      {subtitle && <p className="text-[14px] text-[var(--secondary)] max-w-xs">{subtitle}</p>}
    </div>
  )
}

export function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-semibold text-[var(--secondary)] tracking-widest uppercase mb-2 px-1 ${className}`}>
      {children}
    </p>
  )
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-[var(--card2)] ${className}`} />
}

export function SegmentedControl<T extends string>({
  options, value, onChange, className = ''
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={`flex p-1 rounded-[16px] bg-[var(--card2)] gap-0.5 ${className}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-[12px] text-[13px] font-semibold transition-all relative whitespace-nowrap`}
        >
          {value === opt.value && (
            <motion.div
              layoutId="seg-active"
              className="absolute inset-0 rounded-[12px] bg-[var(--primary)]"
              transition={{ type: 'spring', stiffness: 580, damping: 28 }}
            />
          )}
          <span className={`relative z-10 ${value === opt.value ? 'text-[var(--on-primary)]' : 'text-[var(--secondary)]'}`}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  )
}
