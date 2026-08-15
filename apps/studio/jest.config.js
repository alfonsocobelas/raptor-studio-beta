/** @type {import('jest').Config} */

const base = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: __dirname,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }]
  },
  moduleNameMapper: {
    // @raptor/* llegan por file:../../dist (symlink): en tests se resuelven a los fuentes del monorepo
    '^@raptor/schema$': '<rootDir>/../../libs/schema/src/index.ts',
    '^@raptor/generators/src/(.*)$': '<rootDir>/../../libs/generators/src/$1',
    '^@app/shared/domain$': '<rootDir>/libs/shared/domain/src/index.ts',
    '^@app/backend/(.*)$': '<rootDir>/libs/backend/src/$1'
  },
  clearMocks: true,
  cacheDirectory: '<rootDir>/.tmp/jestCache'
}

module.exports = {
  testTimeout: 30000,
  passWithNoTests: true,
  projects: [
    {
      ...base,
      displayName: 'unit',
      testMatch: ['<rootDir>/libs/backend/tests/modules/**/*.test.ts']
    },
    {
      // Necesita el Postgres del compose de test: `make test-up` antes de correrla.
      ...base,
      displayName: 'integration',
      testMatch: ['<rootDir>/libs/backend/tests/infrastructure/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/libs/backend/tests/infrastructure/jest.setup.integration.ts']
    }
  ]
}
