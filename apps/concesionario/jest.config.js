/** @type {import('jest').Config} */

// Tests unitarios del backend emitido (VO property-tests + los que se escriban a mano
// sobre mothers/builders/mocks). Integración/e2e llegarán con su propio proyecto.
module.exports = {
  displayName: 'unit',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: __dirname,
  testMatch: ['<rootDir>/libs/backend/tests/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  moduleNameMapper: {
    '^@app/shared/domain$': '<rootDir>/libs/shared/domain/src/index.ts',
    '^@app/backend/(.*)$': '<rootDir>/libs/backend/src/$1'
  },
  clearMocks: true,
  passWithNoTests: true,
  cacheDirectory: '<rootDir>/.tmp/jestCache'
}
