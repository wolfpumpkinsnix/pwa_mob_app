import fs from "node:fs";
import { defineConfig } from "vite";
import UnoCSS from "unocss/vite";

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

function webComponentTemplate() {
  function findMatchingBrace(str: string) {
    let depth = 1;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "{") depth++;
      else if (str[i] === "}") depth--;
      if (depth === 0) return { content: str.substring(0, i), length: i };
    }
    return { content: "", length: -1 };
  }

  return {
    name: "web-component-template",
    enforce: "pre" as const,
    load(id: string) {
      if (!id.split("?")[0].endsWith(".html")) return;
      if (id.includes("index.html")) return;

      let filePath = id.split("?")[0];
      // Normalize Windows paths
      if (filePath.startsWith('/') && filePath[2] === ':') {
        filePath = filePath.slice(1);
      }
      
      if (!fs.existsSync(filePath)) {
        console.log(`[Template Plugin] File not found: ${filePath}`);
        return;
      }
      
      const content = fs.readFileSync(filePath, "utf-8");
      let result = content;
      
      // 1. Handle @for (item of list)
      // Use [\s\S]*? to handle multi-line and nested braces
      const forRegex = /@for\s*\(\s*(\w+)\s+of\s+([a-zA-Z0-9_.]+)\s*\)\s*\{/g;
      let match;
      while ((match = forRegex.exec(result)) !== null) {
        const startIndex = match.index;
        const contentStart = startIndex + match[0].length;
        const { content: forContent, length } = findMatchingBrace(result.substring(contentStart));
        if (length !== -1) {
          const replacement = `<for-loop data-list="${match[2]}" data-item="${match[1]}"><template>${forContent}</template></for-loop>`;
          result = result.substring(0, startIndex) + replacement + result.substring(contentStart + length + 1);
          forRegex.lastIndex = 0;
        }
      }

      // 2. Handle @if (cond) { ... } @else { ... }
      const ifRegex = /@if\s*\(\s*([\s\S]+?)\s*\)\s*\{/g;
      while ((match = ifRegex.exec(result)) !== null) {
        const startIndex = match.index;
        const condition = match[1];
        const contentStart = startIndex + match[0].length;
        const { content: ifContent, length: ifLength } = findMatchingBrace(result.substring(contentStart));
        
        if (ifLength !== -1) {
          let totalLength = match[0].length + ifLength + 1;
          let elseContent = "";
          const rest = result.substring(startIndex + totalLength);
          const elseMatch = rest.match(/^\s*@else\s*\{/);
          
          if (elseMatch) {
            const elseStart = elseMatch[0].length;
            const { content: eContent, length: eLength } = findMatchingBrace(rest.substring(elseStart));
            if (eLength !== -1) {
              elseContent = eContent;
              totalLength += elseStart + eLength + 1;
            }
          }

          const replacement = `<if-block data-cond="${condition.replace(/"/g, '&quot;').trim()}"><template data-type="if">${ifContent}</template>${elseContent ? `<template data-type="else">${elseContent}</template>` : ""}</if-block>`;
          result = result.substring(0, startIndex) + replacement + result.substring(startIndex + totalLength);
          ifRegex.lastIndex = 0;
        }
      }

      console.log(`[Template Plugin] Transformed: ${filePath}`);
      return `export default ${JSON.stringify(result)};`;
    },
  };
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
