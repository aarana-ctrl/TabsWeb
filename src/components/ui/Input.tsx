import { useState } from 'react'

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
      <div className={`relative bg-[var(--card)] rounded-btn px-[18px] pt-[22px] pb-[10px] transition-shadow
        ${focused ? 'ring-2 ring-[var(--primary)]/20' : ''}`}>
        <label
          className={`absolute left-[18px] font-medium text-[var(--secondary)] pointer-events-none transition-all duration-150 ${
            lifted ? 'top-[8px] text-[11px]' : 'top-[50%] -translate-y-1/2 text-[15px]'
          }`}
        >
          {label}
        </label>
        <input
          placeholder=""
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-[15px] text-[var(--primary)] caret-[var(--primary)] outline-none"
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
          <label
            className={`absolute top-[8px] left-0 text-[10px] font-medium text-[var(--secondary)] pointer-events-none transition-opacity duration-150 ${
              hasValue ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {label}
          </label>
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
