import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import path from "node:path";

config();

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
  },
});
