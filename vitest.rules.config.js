import { defineConfig } from "vitest/config";

// Testes das regras de segurança: rodam contra o emulador do Firebase
// (npm run test:rules), nunca contra o projeto real.
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.js"],
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
