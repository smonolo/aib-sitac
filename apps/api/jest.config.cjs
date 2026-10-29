/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  moduleNameMapper: {
    '^@aib-sitac/core$': '<rootDir>/../../packages/core/src/index.ts',
  },
}
