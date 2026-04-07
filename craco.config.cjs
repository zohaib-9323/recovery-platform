const path = require('node:path')

/** @type {import('@craco/craco').CracoConfig} */
module.exports = {
  jest: {
    configure: (jestConfig) => {
      jestConfig.moduleNameMapper = {
        ...jestConfig.moduleNameMapper,
        '^@/(.*)$': '<rootDir>/src/$1',
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
