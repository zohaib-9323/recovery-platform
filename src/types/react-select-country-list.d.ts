declare module 'react-select-country-list' {
  export type CountryListOption = {
    label: string
    value: string
  }

  type CountryListApi = {
    getData: () => CountryListOption[]
  }

  export default function countryList(): CountryListApi
}
