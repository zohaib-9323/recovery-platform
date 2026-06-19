import { City, Country } from 'country-state-city'

export type CountryCityOption = {
  label: string
  value: string
}

const countryAliases: Record<string, string[]> = {
  vietnam: ['vietnam', 'viet nam'],
  us: ['unitedstates', 'unitedstatesofamerica', 'usa', 'us'],
  uk: ['unitedkingdom', 'uk', 'greatbritain', 'britain'],
}

export function normalizeCountryName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

export function findCountryByName(countryName: string) {
  if (!countryName) return null

  const allCountries = Country.getAllCountries()
  const normalizedInput = normalizeCountryName(countryName)
  const aliasGroup = Object.values(countryAliases).find((aliases) =>
    aliases.map(normalizeCountryName).includes(normalizedInput),
  )
  const matchableNames = aliasGroup?.map(normalizeCountryName) || [normalizedInput]

  return (
    allCountries.find((country) => {
      const normalizedCountry = normalizeCountryName(country.name)
      return matchableNames.includes(normalizedCountry)
    }) ?? null
  )
}

export function getCitiesForCountryName(countryName: string): CountryCityOption[] {
  const matchedCountry = findCountryByName(countryName)
  if (!matchedCountry) return []

  return (
    City.getCitiesOfCountry(matchedCountry.isoCode)?.map((city) => ({
      label: city.name,
      value: city.name,
    })) ?? []
  )
}

export function resolveCountryOptionByLabel(
  options: CountryCityOption[],
  label: string,
): CountryCityOption | null {
  if (!label) return null

  const directMatch = options.find((opt) => opt.label === label)
  if (directMatch) return directMatch

  if (label === 'UK') {
    return options.find((opt) => opt.value === 'GB' || opt.label === 'United Kingdom') ?? null
  }

  return null
}
