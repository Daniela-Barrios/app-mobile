import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    // Las pruebas unitarias no tocan la base de datos, pero env.ts exige
    // DATABASE_URL al cargarse; se fija un valor dummy solo para el entorno de test.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test_db?schema=public",
    },
  },
});
