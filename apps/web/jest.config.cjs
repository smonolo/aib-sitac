/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: ['**/lib/**/*.test.ts', '**/components/**/*.test.tsx'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@aib-sitac/core$': '<rootDir>/../../packages/core/src/index.ts',
    '^@solar-icons/react/linear/(.*)$':
      '<rootDir>/../../node_modules/@solar-icons/react/dist/icons/linear/$1.mjs',
  },
  transformIgnorePatterns: ['/node_modules/(?!(@solar-icons)/)'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
      },
    ],
    '^.+\\.mjs$': '<rootDir>/jest-esm-transform.cjs',
  },
}
