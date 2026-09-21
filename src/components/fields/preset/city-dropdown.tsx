import { useEffect, useMemo, useRef, useState } from 'react'
import {
  components,
  type DropdownIndicatorProps,
  type GroupBase,
  type MenuProps,
} from 'react-select'
import CreatableSelect from 'react-select/creatable'

import { getCitiesForCountryName, type CountryCityOption } from '@/lib/country-city'

export type CityDropdownProps = {
  id?: string
  value: string
  countryName: string
  onChange: (city: string) => void
  placeholder?: string
  formatCreateLabel?: (inputValue: string) => string
  backgroundColor?: string
  borderColor?: string
  borderRadius?: number
}

const DropdownIndicator = (props: DropdownIndicatorProps<CountryCityOption, false>) => {
  const isOpen = props.selectProps.menuIsOpen
  const isDisabled = props.selectProps.isDisabled
  return (
    <components.DropdownIndicator {...props}>
      <span
        className={`icon-arrow-${isOpen ? 'up' : 'down'} text-xs ${isDisabled ? 'text-rp-disabled' : 'text-rp-fg'}`}
      />
    </components.DropdownIndicator>
  )
}

export function CityDropdown({
  id,
  value,
  countryName,
  onChange,
  placeholder,
  formatCreateLabel,
  backgroundColor,
  borderColor,
  borderRadius,
}: CityDropdownProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLElement | null>(null)
  const hasJustOpenedRef = useRef(false)
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const [cities, setCities] = useState<CountryCityOption[]>([])

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!countryName) {
        setCities([])
        return
      }

      setCities(getCitiesForCountryName(countryName))
    }, 100)

    return () => clearTimeout(timeout)
  }, [countryName])

  const selectedOption = useMemo(() => {
    if (!value) return null
    return cities.find((option) => option.label === value) ?? { label: value, value }
  }, [cities, value])

  return (
    <div ref={wrapperRef}>
      <CreatableSelect<CountryCityOption, false>
        inputId={id}
        options={cities}
        value={selectedOption}
        onChange={(next) => onChange(next?.label ?? '')}
        placeholder={placeholder}
        isSearchable
        isDisabled={!countryName}
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
        classNamePrefix="rp-city-select"
        maxMenuHeight={250}
        formatCreateLabel={formatCreateLabel}
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 44,
            borderRadius: borderRadius ?? 10,
            borderColor: state.isFocused ? 'var(--rp-accent)' : (borderColor ?? 'var(--rp-border)'),
            backgroundColor: backgroundColor ?? 'var(--rp-input)',
            boxShadow: 'none',
            '&:hover': { borderColor: borderColor ?? 'var(--rp-border)' },
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
