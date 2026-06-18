import { useEffect, useMemo, useRef, useState } from 'react'
import Select, {
  components,
  type DropdownIndicatorProps,
  type GroupBase,
  type MenuProps,
} from 'react-select'
import countryList from 'react-select-country-list'

import { resolveCountryOptionByLabel, type CountryCityOption } from '@/lib/country-city'

export type CountryDropdownProps = {
  id?: string
  value: string
  onChange: (country: string) => void
  placeholder?: string
}

const DropdownIndicator = (props: DropdownIndicatorProps<CountryCityOption, false>) => {
  const isOpen = props.selectProps.menuIsOpen
  return (
    <components.DropdownIndicator {...props}>
      <span className={`icon-arrow-${isOpen ? 'up' : 'down'} text-xs text-rp-fg`} />
    </components.DropdownIndicator>
  )
}

export function CountryDropdown({ id, value, onChange, placeholder }: CountryDropdownProps) {
  const options = useMemo(() => countryList().getData(), [])
  const selectedOption = useMemo(
    () => resolveCountryOptionByLabel(options, value),
    [options, value],
  )

  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLElement | null>(null)
  const hasJustOpenedRef = useRef(false)
  const [menuIsOpen, setMenuIsOpen] = useState(false)

  const CustomMenu = (
    menuProps: MenuProps<CountryCityOption, false, GroupBase<CountryCityOption>>,
  ) => {
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
    <div ref={wrapperRef}>
      <Select
        inputId={id}
        options={options}
        value={selectedOption}
        onChange={(next) => onChange(next?.label ?? '')}
        placeholder={placeholder}
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
        classNamePrefix="rp-country-select"
        maxMenuHeight={250}
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 44,
            borderRadius: 10,
            borderColor: state.isFocused ? 'var(--rp-accent)' : 'var(--rp-border)',
            backgroundColor: 'var(--rp-input)',
            boxShadow: 'none',
            '&:hover': { borderColor: 'var(--rp-border)' },
          }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
        components={{
          IndicatorSeparator: () => null,
          DropdownIndicator,
          Menu: CustomMenu,
        }}
      />
    </div>
  )
}
