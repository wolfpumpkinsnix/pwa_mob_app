import { defineConfig } from "vite";
import UnoCSS from "unocss/vite";

import { webComponentTemplate } from "./build/web-component-template";
import { VitePWA } from "vite-plugin-pwa";

function normalizeBasePath(basePath: string) {
  if (!basePath || basePath === "/") return "/";

  let normalized = basePath.trim();
  if (!normalized) return "/";
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (!normalized.endsWith("/")) normalized = `${normalized}/`;
  return normalized;
}

function getProductionBasePath() {
  if (process.env.BASE_PATH) return process.env.BASE_PATH;
  if (process.env.VITE_BASE_PATH) return process.env.VITE_BASE_PATH;

  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  return repositoryName ? `/${repositoryName}/` : "/";
}

export default defineConfig(({ command }) => {
  const base = command === "serve"
    ? "/"
    : normalizeBasePath(getProductionBasePath());

  return {
    base,
    plugins: [
      webComponentTemplate(),
      UnoCSS({
        mode: "shadow-dom",
      }),
      VitePWA({
        registerType: "autoUpdate",
        manifestFilename: "manifest.webmanifest",
        includeAssets: [
          "favicon.svg",
          "pwa-192x192.png",
          "pwa-512x512.png",
          "pwa-96x96.png",
          "screenshot-wide.png",
          "screenshot-mobile.png",
        ],
        manifest: {
          id: base,
          name: "My PWA Web Components",
          short_name: "PWA WebComp",
          description:
            "A dependency-light Progressive Web App built with Web Components",
          display_override: ["window-controls-overlay", "standalone"],
          theme_color: "#1a1a1a",
          background_color: "#ffffff",
          display: "standalone",
          start_url: base,
          scope: base,
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
  };
});
