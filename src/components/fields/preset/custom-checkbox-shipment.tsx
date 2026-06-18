export type CustomCheckboxShipmentProps = {
  onChange: () => void
  isChecked?: boolean
  label?: string
  className?: string
  width?: string
  height?: string
  iconSize?: string
}

/** Matches trade-harmonizer `CustomCheckbox` (manage shipments / generic table). */
export function CustomCheckboxShipment({
  onChange,
  label,
  className,
  width,
  height,
  iconSize,
  isChecked = false,
}: CustomCheckboxShipmentProps) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 ${className ?? ''}`}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        className="hidden"
        aria-checked={isChecked}
      />
      <div
        className={`${width || 'min-w-5'} ${
          height || 'h-5'
        } flex items-center justify-center rounded-md transition-all ${
          isChecked ? 'bg-yellow' : 'border border-bottomBorder bg-white'
        }`}
      >
        {isChecked && <span className={`icon-tick text-white ${iconSize || 'text-[8px]'}`} />}
      </div>
      {label ? <span className="text-black">{label}</span> : null}
    </label>
  )
}
