import { registerSW } from 'virtual:pwa-register';

function ensureManifestLink() {
  const existingLink = document.querySelector('link[rel~="manifest"]');
  if (existingLink) return;

  const manifestLink = document.createElement('link');
  manifestLink.setAttribute('rel', 'manifest');
  manifestLink.setAttribute('href', `${import.meta.env.BASE_URL}manifest.webmanifest`);
  document.head.appendChild(manifestLink);
}

export function setupPwa() {
  ensureManifestLink();

  registerSW({
    immediate: true,
    onRegisteredSW(swUrl) {
      console.log(`Service worker registered: ${swUrl}`);
    },
    onRegisterError(error) {
      console.error('Service worker registration failed.', error);
    },
    onNeedRefresh() {
      if (confirm('New content available. Reload?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline.');
    },
  });
}
