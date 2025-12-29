import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "client/**/*.test.{ts,tsx}",
      "server/**/*.test.{ts,tsx}",
      "shared/**/*.test.{ts,tsx}",
    ],
    exclude: ["node_modules", "dist", "tmp_tsx", "attached_assets"],
  },
});
