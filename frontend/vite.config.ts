import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const envDir = resolve(process.cwd(), "..");
  const env = {
    ...loadEnv(mode, envDir, ""),
    ...process.env,
  };
  const frontendPort = Number(env.LOCAL_FRONTEND_PORT ?? 3000);
  const backendPort = Number(env.LOCAL_BACKEND_PORT ?? 8080);

  return {
    plugins: [react()],
    envDir,
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      host: "0.0.0.0",
      port: frontendPort,
      proxy: {
        "/api": `http://localhost:${backendPort}`,
      },
    },
  };
});
