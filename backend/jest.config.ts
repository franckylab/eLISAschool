import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testTimeout: 30000, // intégration DB : initialize + synchronize peuvent dépasser 5s
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
  },
  testMatch: [
    '**/test/**/*.spec.ts',
    '**/test/**/*.test.ts',
    '**/tests/**/*.spec.ts',
    '**/tests/**/*.test.ts',
  ],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testPathIgnorePatterns: ['<rootDir>/tests/integration/'], // scripts d'intégration autonomes (runTests+process.exit), lancés via tsx
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { diagnostics: false }],
  },
};

export default config;
