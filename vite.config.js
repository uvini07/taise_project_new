import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        // React e os gráficos ficam em arquivos próprios: o cache do navegador
        // sobrevive às mudanças de layout. O Firebase é dividido naturalmente,
        // então o site público não baixa Auth/Storage (só o painel usa).
        manualChunks(id) {
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) return "charts";
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "react";
        },
      },
    },
  },
  test: {
    include: ["tests/unit/**/*.test.{js,jsx}"],
    environment: "node",
  },
});
