// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Frontend-specific Jest configuration with Next.js setup
const frontendJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  testMatch: ['**/__tests__/unit/**/*.(test|spec).(ts|tsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'app/page.tsx',
    'app/layout.tsx',
    'app/bills/page.tsx',
    '!app/globals.css',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage/frontend'
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(frontendJestConfig)