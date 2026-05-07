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
      includeAssets: [
        "favicon.svg",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-96x96.png",
        "screenshot-wide.png",
        "screenshot-mobile.png",
      ],
      manifest: {
        id: "pwa-web-comp",
        name: "My PWA Web Components",
        short_name: "PWA WebComp",
        description:
          "A dependency-light Progressive Web App built with Web Components",
        display_override: ["window-controls-overlay"],
        theme_color: "#1a1a1a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: ".",
        scope: ".",
        prefer_related_applications: false,
        icons: [
          {
            src: "pwa-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-96x96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshot-wide.png",
            sizes: "1264x705",
            type: "image/png",
            form_factor: "wide",
            label: "Desktop View",
          },
          {
            src: "screenshot-mobile.png",
            sizes: "500x717",
            type: "image/png",
            label: "Mobile View",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
        suppressWarnings: true,
      },
    }),
  ],
});
