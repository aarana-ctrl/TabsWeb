import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from './motion'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

/** Floating-label text field — mirrors FloatingTextField.swift */
export function TextInput({ label, error, className = '', ...rest }: TextInputProps) {
  const [focused, setFocused] = useState(false)
  const hasValue = String(rest.value ?? '').length > 0
  const lifted = focused || hasValue

  return (
    <div className={`relative ${className}`}>
      <div className={`bg-[var(--card)] rounded-btn px-[18px] pt-[22px] pb-[10px] transition-shadow
        ${focused ? 'ring-2 ring-[var(--primary)]/20' : ''}`}>
        <AnimatePresence>
          {lifted && (
            <motion.label
              initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 6, opacity: 0 }}
              transition={spring.snap}
              className="absolute top-[8px] left-[18px] text-[11px] font-medium text-[var(--secondary)]"
            >
              {label}
            </motion.label>
          )}
        </AnimatePresence>
        <input
          placeholder={lifted ? '' : label}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-[15px] text-[var(--primary)] placeholder:text-[var(--secondary)] caret-[var(--primary)]"
          {...rest}
        />
      </div>
      {error && <p className="mt-1 ml-1 text-[12px] text-tabs-red">{error}</p>}
    </div>
  )
}

/** Currency input ($ prefix) — mirrors CurrencyField.swift */
export function CurrencyInput({
  label, value, onChange, allowNegative = false, className = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  allowNegative?: boolean
  className?: string
}) {
  const [focused, setFocused] = useState(false)
  const hasValue = value.length > 0

  return (
    <div className={`relative ${className}`}>
      <div className={`flex items-center bg-[var(--card)] rounded-btn transition-shadow
        ${focused ? 'ring-2 ring-[var(--primary)]/20' : ''}`}>
        <span className="pl-[18px] font-mono text-[18px] text-[var(--secondary)] select-none">$</span>
        <div className="flex-1 relative pt-[22px] pb-[10px] pr-[18px] pl-[4px]">
          <AnimatePresence>
            {hasValue && (
              <motion.label
                initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 6, opacity: 0 }}
                transition={spring.snap}
                className="absolute top-[8px] left-0 text-[10px] font-medium text-[var(--secondary)]"
              >
                {label}
              </motion.label>
            )}
          </AnimatePresence>
          <input
            type={allowNegative ? 'text' : 'number'}
            inputMode="decimal"
            placeholder={hasValue ? '' : '0'}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent font-mono text-[20px] text-[var(--primary)] placeholder:text-[var(--secondary)]/50 caret-[var(--primary)]"
          />
        </div>
      </div>
    </div>
  )
}
