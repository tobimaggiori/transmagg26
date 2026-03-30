/**
 * Propósito: Configuración de Jest para el proyecto Transmagg.
 * Define el entorno de tests, transformaciones TypeScript y alias de rutas.
 */
import type { Config } from "jest"

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.(ts|tsx)", "**/*.spec.(ts|tsx)"],
  collectCoverageFrom: [
    "src/lib/**/*.{ts,tsx}",
    "!src/lib/prisma.ts",
  ],
}

export default config
