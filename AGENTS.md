# AGENTS.md

## Project Overview

- Treat this project as a lightweight Progressive Web App built with plain TypeScript and Vite.
- Preserve the custom Web Component architecture and Angular-like decorator workflow.
- Use `@preact/signals-core` for reactivity patterns already established in the codebase.

## Architecture Rules

- Keep app root components and app-level view state under `src/app/`.
- Keep platform helpers, such as PWA setup, under `src/core/`.
- Keep reusable UI components under `src/shared/components/`.
- Keep feature-owned components under `src/features/<feature>/`.
- When adding a component, create a dedicated folder named after the component or view.
- Keep each component's `.ts`, `.html`, and `.css` files separate.
- Import component templates and styles into the TypeScript file with Vite `?raw` imports.
- Follow the existing decorator-based component pattern, such as `@Component`.
- Treat the template engine as a two-part system:
  - compile-time template transforms in `vite.config.ts`
  - runtime directive binding and interpolation in `src/lib/component.ts`
- When changing template syntax or adding directives, keep the compile-time transform output and the runtime DOM handling in sync.
- UnoCSS is part of the styling pipeline and is configured for Shadow DOM usage.
- Utility classes may be used in component templates when they fit the existing approach.

## Package Manager

- This project uses Yarn `4.15.0`.
- Prefer `yarn <command>` when Yarn is available.
- If global Yarn or Corepack is unavailable, run Yarn through the committed release file:
  - `node .yarn/releases/yarn-4.15.0.cjs <command>`
- Do not install or rely on Yarn v1 for this project.

## PWA Rules

- `vite-plugin-pwa` owns manifest generation and service worker generation.
- `src/core/pwa.ts` owns service worker registration through `virtual:pwa-register` and the runtime manifest-link fallback.
- `src/main.ts` should import and call `setupPwa()`.
- Do not add duplicate hardcoded manifest links in `index.html`; keep the existing runtime fallback in `src/core/pwa.ts`.
- Prefer the existing `vite-plugin-pwa` and Workbox configuration over adding another PWA dependency.
- Preserve required Android installability fields: `name` or `short_name`, `start_url`, `scope`, `display`, and `192x192` plus `512x512` PNG icons.

## Deployment and Base Path

- GitHub Pages deployment uses `/pwa_mob_app/`.
- Keep Vite `base`, manifest `id`, manifest `start_url`, manifest `scope`, service worker scope, generated asset URLs, and deployment path aligned.
- Preserve `BASE_PATH`, `VITE_BASE_PATH`, and `GITHUB_REPOSITORY` fallback behavior in `vite.config.ts`.
- Android installability requires a secure context: HTTPS is valid, `localhost` is valid for local testing, but phone access through `http://192.168.x.x` is not.

## Performance Expectations

- Prefer native Web Components and Shadow DOM patterns over framework-style abstractions.
- Protect the project's low-overhead design; avoid introducing heavy runtime dependencies or virtual DOM patterns.
- Preserve fine-grained updates driven by `@preact/signals-core` rather than broad rerender-style flows.
- Keep template and styling work aligned with the existing build-time Vite plugin behavior, including template transforms such as `@for` and `@if`.
- Maintain component-scoped HTML and CSS so style and render costs stay localized.
- Preserve the lightweight template engine approach; prefer extending the existing transform-and-bind pipeline over introducing a general-purpose templating dependency.
- Preserve the current UnoCSS Shadow DOM integration instead of bypassing it with a separate styling system.

## Docs Maintenance

- Update `PWA_GUIDE.md` whenever PWA setup, installability behavior, manifest config, service worker registration, icons, screenshots, or deployment paths change.
- Keep `AGENTS.md` concise and directive; keep tutorial-style explanations in `PWA_GUIDE.md`.

## Worktree Safety

- Do not recreate deleted files like `GEMINI.md` unless explicitly asked.
- Do not overwrite unrelated user edits, including current changes in `src/app/app.component.html`.

## Verification

- Before finalizing changes, run `yarn verify`.
- Treat `yarn verify` as required validation for this repository.
- If global Yarn or Corepack is unavailable, run `node .yarn/releases/yarn-4.15.0.cjs verify`.
- For PWA or base-path edits, also validate with `BASE_PATH=/pwa_mob_app/ yarn build`.
- Without global Yarn, validate PWA or base-path edits with `BASE_PATH=/pwa_mob_app/ node .yarn/releases/yarn-4.15.0.cjs build`.
- If verification cannot run because Node or Yarn is unavailable, say so clearly in the final response.
