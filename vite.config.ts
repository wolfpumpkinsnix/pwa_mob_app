import { defineConfig } from "vite";
import UnoCSS from "unocss/vite";

import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/pwa_mob_app/",
  plugins: [
    UnoCSS({
      mode: "shadow-dom",
    }),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        id: "/pwa_mob_app/",
        name: "My PWA Web Components",
        short_name: "PWA WebComp",
        description:
          "A dependency-light Progressive Web App built with Web Components",
        theme_color: "#1a1a1a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/pwa_mob_app/",
        scope: "/pwa_mob_app/",
        prefer_related_applications: false,
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable monochrome",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable monochrome",
          },
        ],
      },
    }),
  ],
});
