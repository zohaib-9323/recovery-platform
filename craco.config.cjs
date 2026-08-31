const path = require('node:path')

/** @type {import('@craco/craco').CracoConfig} */
module.exports = {
  style: {
    postcss: {
      mode: 'file',
    },
  },
  jest: {
    configure: (jestConfig) => {
      jestConfig.moduleNameMapper = {
        ...jestConfig.moduleNameMapper,
        '^@/(.*)$': '<rootDir>/src/$1',
      }
      // `@reduxjs/toolkit/query`'s dev bundle pulls in `@standard-schema/utils`,
      // which ships ESM-only (no CJS build, `"type": "module"`). CRA's default
      // transformIgnorePatterns skips all of node_modules, so Jest tries to run
      // its `export {...}` syntax as CJS and throws — carve out an exception so
      // babel-jest transforms just this package, same pattern as the default.
      jestConfig.transformIgnorePatterns = [
        '[/\\\\]node_modules[/\\\\](?!@standard-schema).+\\.(js|jsx|mjs|cjs|ts|tsx)$',
        '^.+\\.module\\.(css|sass|scss)$',
      ]
      jestConfig.collectCoverageFrom = [
        'src/services/api.ts',
        'src/services/authSession.ts',
        'src/services/authStorage.ts',
        'src/lib/validation.ts',
        'src/lib/api-error.ts',
        'src/lib/api-errors.ts',
        'src/lib/schemas/api.ts',
        'src/utils/env.ts',
        'src/pages/auth/hooks/useForgotPasswordForm.ts',
        'src/pages/auth/hooks/useResetPasswordForm.ts',
        'src/pages/(dashboard)/settings/build-profile-patch.ts',
      ]
      jestConfig.coverageThreshold = {
        global: {
          lines: 70,
          statements: 70,
          functions: 70,
          branches: 65,
        },
        'src/services/api.ts': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 80,
        },
        'src/services/authSession.ts': {
          lines: 85,
          statements: 85,
          functions: 90,
          branches: 60,
        },
        'src/services/authStorage.ts': {
          lines: 75,
          statements: 70,
          functions: 90,
          branches: 70,
        },
        'src/pages/auth/hooks/useForgotPasswordForm.ts': {
          lines: 65,
          statements: 65,
          functions: 60,
          branches: 55,
        },
        'src/pages/auth/hooks/useResetPasswordForm.ts': {
          lines: 75,
          statements: 75,
          functions: 50,
          branches: 75,
        },
      }
      return jestConfig
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Avoid ajv / fork-ts-checker version clashes from react-scripts' dependency tree on modern npm.
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin?.constructor?.name !== 'ForkTsCheckerWebpackPlugin',
      )
      return webpackConfig
    },
  },
}
