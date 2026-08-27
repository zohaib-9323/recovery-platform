import { useEffect, useMemo, useRef, useState } from 'react'
import Select, {
  components,
  type DropdownIndicatorProps,
  type GroupBase,
  type MenuProps,
  type SingleValueProps,
} from 'react-select'
import { Country } from 'country-state-city'

import { MU } from '@/lib/manage-users-copy'

export type PhoneCodeOption = {
  /** Dial code, always normalised to a leading `+` (e.g. `+44`). */
  value: string
  /** `+44 United Kingdom` — shown in the menu. */
  label: string
}

export type PhoneCodeDropdownProps = {
  id?: string
  value: string
  onChange: (phoneCode: string) => void
}

function normalizeDialCode(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    return ''
  }
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`
}

/** Figma shows a solid caret rather than the chevron used elsewhere in the app. */
const DropdownIndicator = (props: DropdownIndicatorProps<PhoneCodeOption, false>) => (
  <components.DropdownIndicator {...props} className="!p-0">
    <svg width="11" height="8" viewBox="0 0 11 8" fill="none" aria-hidden>
      <path d="M5.33 8L0.14 0.5H10.53L5.33 8Z" fill="currentColor" />
    </svg>
  </components.DropdownIndicator>
)

/** The control shows only the dial code, matching the Figma's `+ XX` box. */
const SingleValue = (props: SingleValueProps<PhoneCodeOption, false>) => (
  <components.SingleValue {...props}>{props.data.value}</components.SingleValue>
)

/**
 * Figma "Frame 106": a 77px grey box holding the dial code and a caret. Follows
 * the same react-select wiring as `CountryDropdown` (outside-click + scroll
 * close, portalled menu) so both dropdowns behave identically.
 */
export function PhoneCodeDropdown({ id, value, onChange }: PhoneCodeDropdownProps) {
  const options = useMemo<PhoneCodeOption[]>(() => {
    const seen = new Set<string>()
    return Country.getAllCountries().reduce<PhoneCodeOption[]>((acc, country) => {
      const code = normalizeDialCode(country.phonecode)
      if (!code || seen.has(code)) {
        return acc
      }
      seen.add(code)
      acc.push({ value: code, label: `${code} ${country.name}` })
      return acc
    }, [])
  }, [])

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  )

  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLElement | null>(null)
  const hasJustOpenedRef = useRef(false)
  const [menuIsOpen, setMenuIsOpen] = useState(false)

  const CustomMenu = (menuProps: MenuProps<PhoneCodeOption, false, GroupBase<PhoneCodeOption>>) => {
    const { innerRef } = menuProps
    useEffect(() => {
      if (innerRef && typeof innerRef !== 'function') {
        menuRef.current = innerRef.current
      }
    }, [innerRef])

    return <components.Menu {...menuProps} />
  }

  useEffect(() => {
    const handleOutsideInteraction = (event: Event) => {
      const target = event.target as Node
      if (
        !hasJustOpenedRef.current &&
        !wrapperRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setMenuIsOpen(false)
      }
    }

    if (menuIsOpen) {
      window.addEventListener('mousedown', handleOutsideInteraction, true)
      window.addEventListener('scroll', handleOutsideInteraction, true)
    }

    return () => {
      window.removeEventListener('mousedown', handleOutsideInteraction, true)
      window.removeEventListener('scroll', handleOutsideInteraction, true)
    }
  }, [menuIsOpen])

  return (
    <div ref={wrapperRef} className="w-[78px] shrink-0">
      <Select
        inputId={id}
        aria-label={MU.phoneCode}
        options={options}
        value={selectedOption}
        onChange={(next) => onChange(next?.value ?? '')}
        placeholder={MU.phoneCodePlaceholder}
        isSearchable
        menuPlacement="auto"
        menuPosition="fixed"
        menuIsOpen={menuIsOpen}
        onMenuOpen={() => {
          hasJustOpenedRef.current = true
          setMenuIsOpen(true)
          setTimeout(() => {
            hasJustOpenedRef.current = false
          }, 200)
        }}
        onMenuClose={() => setMenuIsOpen(false)}
        classNamePrefix="rp-phone-code-select"
        maxMenuHeight={220}
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 40,
            height: 40,
            borderRadius: 5,
            paddingLeft: 4,
            paddingRight: 8,
            borderColor: state.isFocused ? 'var(--primary-color, #E3A602)' : '#DADADA',
            backgroundColor: '#F2F2F2',
            boxShadow: 'none',
            '&:hover': { borderColor: '#DADADA' },
          }),
          valueContainer: (base) => ({ ...base, padding: '0 8px' }),
          singleValue: (base) => ({ ...base, fontSize: 16, color: '#000000' }),
          placeholder: (base) => ({ ...base, fontSize: 16, color: '#797979' }),
          input: (base) => ({ ...base, fontSize: 16, margin: 0, padding: 0 }),
          indicatorsContainer: (base) => ({ ...base, color: '#000000' }),
          menu: (base) => ({ ...base, width: 260, fontSize: 14 }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
        components={{
          IndicatorSeparator: () => null,
          DropdownIndicator,
          SingleValue,
          Menu: CustomMenu,
        }}
      />
    </div>
  )
}
