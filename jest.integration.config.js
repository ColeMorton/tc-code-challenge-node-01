module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.(test|spec).(ts|tsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: false,
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/__tests__/integration/jest.setup.js'],
  globalSetup: '<rootDir>/__tests__/integration/globalSetup.ts',
  globalTeardown: '<rootDir>/__tests__/integration/globalTeardown.ts',
  silent: true,
}