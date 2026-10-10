import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em desenvolvimento, imita a função da Vercel /api/img/{id}.
function devImageApi() {
  return {
    name: "dev-image-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url.match(/^\/api\/img\/([A-Za-z0-9]+)/);
        if (!m) return next();
        const emu = process.env.VITE_USE_EMULATORS === "true";
        const base = emu ? "http://127.0.0.1:8080" : "https://firestore.googleapis.com";
        const project = process.env.VITE_FIREBASE_PROJECT_ID || (emu ? "demo-taisefoto" : "taisefoto");
        const r = await fetch(`${base}/v1/projects/${project}/databases/(default)/documents/imageBlobs/${m[1]}`);
        if (!r.ok) { res.statusCode = r.status; return res.end(); }
        const d = await r.json();
        res.setHeader("Content-Type", d.fields?.contentType?.stringValue || "image/webp");
        res.end(Buffer.from(d.fields?.data?.stringValue || "", "base64"));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devImageApi()],
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
