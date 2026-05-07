## Project Description

A simple, dependency-light Progressive Web App (PWA) incorporating a custom, Angular-like Web Component library built from scratch using plain TypeScript and Vite. It leverages standard TypeScript decorators (e.g., `@Component`) to bind HTML templates and scoped CSS using Vite's `?raw` imports. Reactivity is elegantly achieved using `@preact/signals-core`.

## Performance

The core tenet of this project is to maintain an extremely lightweight and high-performance footprint:

- **Zero Framework Overhead:** The application relies natively on Web Components and Shadow DOM, bypassing the need for a heavy Virtual DOM or large framework runtimes.
- **Granular Reactivity:** Powered by `@preact/signals-core`, state updates only target the exact DOM text nodes or attributes that have changed. There is no costly "re-render" lifecycle.
- **Minimal Tooling:** The library uses a custom **Vite Plugin** to pre-compile templates during the build. This transforms keywords like `@for` and `@if` into browser-optimized tags before they reach the client, ensuring rapid component initialization.
- **Scoped Footprint:** CSS and HTML templates are scoped to the individual components, reducing style recalculations across the global document and ensuring rapid component initialization.

## Architecture & Guidelines

- **Component Structure:** When adding a new component, always place its `.ts`, `.html`, and `.css` files inside a dedicated folder named after the component under the `src/components/` directory. Templates and styles **must** be kept in separate `.html` and `.css` files and imported into the `.ts` file using Vite's `?raw` suffix (e.g., `import template from './my.component.html?raw'`).

## Quality Assurance

- **Always Lint & Build:** Before finalizing any changes, always run `yarn lint` and `yarn build` to ensure the codebase remains clean and compiles correctly. All "tests" (linting and building) must pass.
