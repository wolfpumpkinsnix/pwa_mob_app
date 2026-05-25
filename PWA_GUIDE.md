# PWA Setup Guide

This is a simple checklist for making a web app installable as a Progressive Web App.

## 1. Serve the app from a secure origin

PWAs must be served over HTTPS in production. Local development can use `localhost`, but a phone opening a local network address like `http://192.168.1.20:5173` is not considered secure by Android Chrome.

Good:

```text
https://example.com/my-app/
http://localhost:5173/
```

Usually not installable on Android:

```text
http://192.168.1.20:5173/
```

## 2. Add a web app manifest

The manifest describes how the app should look when installed.

Example:

```json
{
  "name": "My App",
  "short_name": "MyApp",
  "description": "A small installable web app",
  "start_url": "/my-app/",
  "scope": "/my-app/",
  "display": "standalone",
  "theme_color": "#1a1a1a",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Important fields:

- `name` or `short_name`
- `start_url`
- `scope`
- `display`, usually `standalone`
- PNG icons, at least `192x192` and `512x512`

## 3. Link the manifest from HTML

The browser must be able to discover the manifest from the page.

```html
<link rel="manifest" href="/my-app/manifest.webmanifest" />
```

When using Vite with `vite-plugin-pwa`, the plugin can inject this link automatically. In that case, avoid adding a second hardcoded manifest link unless you are very sure the paths match.

## 4. Register a service worker

The service worker lets the app cache files and run like an app after installation.

With `vite-plugin-pwa`, registration can be done like this:

```ts
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
  onRegisterError(error) {
    console.error('Service worker registration failed.', error);
  },
});
```

## 5. Use the correct base path

If the app is deployed under a subfolder, every PWA URL must use that same subfolder.

For example, on GitHub Pages:

```text
https://username.github.io/pwa_mob_app/
```

The Vite base path, manifest `start_url`, manifest `scope`, service worker scope, script URLs, and icon URLs all need to agree with `/pwa_mob_app/`.

In this project, the base path is configured in `vite.config.ts` and can be controlled with:

```bash
BASE_PATH=/pwa_mob_app/ yarn build
```

The GitHub Actions workflow already does this during deployment.

## 6. Test installability

On desktop Chrome, open DevTools and check:

- Application > Manifest
- Application > Service Workers
- Lighthouse > PWA checks

On Android Chrome:

- Open the HTTPS deployment URL.
- Wait a little after the first page load.
- Reload once if the service worker was just installed.
- Open the Chrome menu and look for "Install app" or "Add to Home screen".

The `beforeinstallprompt` event is useful for showing a custom install button, but Android Chrome may delay that event even when the app can already be installed from the browser menu.

## Why this project was not installable

This project already had most of the PWA pieces, but the installability flow was fragile because the app is deployed under the GitHub Pages subpath `/pwa_mob_app/`. The manifest, service worker, app base URL, and generated asset URLs must all point to the same scope. A hardcoded manifest link and an incorrect or missing production base path can make Android Chrome read the wrong manifest URL, use the wrong `start_url`, or register the service worker under the wrong scope. Android also requires a secure context, so testing from a phone through a plain local network HTTP address will fail even if the same app works from the HTTPS GitHub Pages URL.

