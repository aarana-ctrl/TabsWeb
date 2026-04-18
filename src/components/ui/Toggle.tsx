interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-checked={checked}
      role="switch"
      className={`relative inline-flex items-center w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
        checked ? 'bg-tabs-green' : 'bg-[var(--card2)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-[2.5px] left-0 w-[27px] h-[27px] rounded-full bg-white shadow-md transform transition-transform duration-200 ${
          checked ? 'translate-x-[27px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  )
}
