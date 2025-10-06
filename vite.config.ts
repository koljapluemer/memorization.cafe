import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [vue(), tailwindcss(), VitePWA()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "dexie-cloud-addon": fileURLToPath(
        new URL("./src/stubs/dexie-cloud-addon.ts", import.meta.url)
      ),
    },
  },
});
