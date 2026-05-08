# AGENTS.md

## Project Overview

- Treat this project as a lightweight Progressive Web App built with plain TypeScript and Vite.
- Preserve the custom Web Component architecture and Angular-like decorator workflow.
- Use `@preact/signals-core` for reactivity patterns already established in the codebase.

## Architecture Rules

- Keep components under `src/components/`.
- When adding a component, create a dedicated folder named after the component.
- Keep each component's `.ts`, `.html`, and `.css` files separate.
- Import component templates and styles into the TypeScript file with Vite `?raw` imports.
- Follow the existing decorator-based component pattern, such as `@Component`.
- Treat the template engine as a two-part system:
  - compile-time template transforms in `vite.config.ts`
  - runtime directive binding and interpolation in `src/lib/component.ts`
- When changing template syntax or adding directives, keep the compile-time transform output and the runtime DOM handling in sync.
- UnoCSS is part of the styling pipeline and is configured for Shadow DOM usage.
- Utility classes may be used in component templates when they fit the existing approach.

## Performance Expectations

- Prefer native Web Components and Shadow DOM patterns over framework-style abstractions.
- Protect the project's low-overhead design; avoid introducing heavy runtime dependencies or virtual DOM patterns.
- Preserve fine-grained updates driven by `@preact/signals-core` rather than broad rerender-style flows.
- Keep template and styling work aligned with the existing build-time Vite plugin behavior, including template transforms such as `@for` and `@if`.
- Maintain component-scoped HTML and CSS so style and render costs stay localized.
- Preserve the lightweight template engine approach; prefer extending the existing transform-and-bind pipeline over introducing a general-purpose templating dependency.
- Preserve the current UnoCSS Shadow DOM integration instead of bypassing it with a separate styling system.

## Verification

- Before finalizing changes, run `yarn verify`.
- Treat `yarn verify` as required validation for this repository.
