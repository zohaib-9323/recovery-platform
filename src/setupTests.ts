import '@testing-library/jest-dom'

// Tests import API modules that require a strict API base URL.
process.env.REACT_APP_API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ?? 'https://example.test.local'
