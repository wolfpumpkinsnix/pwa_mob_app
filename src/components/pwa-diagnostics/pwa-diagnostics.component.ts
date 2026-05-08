import { Component } from '../../lib/component';
import { effect, signal } from '@preact/signals-core';
import template from './pwa-diagnostics.component.html?raw';
import styles from './pwa-diagnostics.component.css?raw';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

@Component({
  selector: 'pwa-diagnostics',
  template,
  styles,
})
export class PwaDiagnosticsComponent extends HTMLElement {
  canInstall = signal(false);
  deferredPrompt: InstallPromptEvent | null = null;
  private _manifestObserver?: MutationObserver;

  diagnostics = signal({
    isHttps: window.location.protocol === 'https:',
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    swActive: false,
    manifestFound: false,
    manifestReachable: false,
    manifestHref: '',
    installPromptFired: false,
    url: window.location.href,
    issue: 'Checking install requirements...',
    nextStep: 'Wait a moment while the manifest and service worker are evaluated.',
  });

  constructor() {
    super();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
      this.canInstall.value = true;
      this.updateDiagnostics({ installPromptFired: true });
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.value = false;
      this.updateDiagnostics({
        installPromptFired: true,
        issue: 'App installed successfully.',
        nextStep: 'Open it from your Android home screen to confirm the standalone experience.',
      });
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        this.updateDiagnostics({ swActive: !!reg.active });
      });
    }
  }

  connectedCallback() {
    void this.checkManifest();

    this._manifestObserver = new MutationObserver(() => {
      void this.checkManifest();
    });
    this._manifestObserver.observe(document.head, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['href', 'rel'],
    });

    setTimeout(() => this._manifestObserver?.disconnect(), 5000);

    effect(() => {
      const canInstall = this.canInstall.value;
      const btn = this.shadowRoot?.getElementById('install-btn');
      if (btn) {
        btn.style.display = canInstall ? 'inline-block' : 'none';
      }
    });
  }

  disconnectedCallback() {
    this._manifestObserver?.disconnect();
  }

  private updateDiagnostics(
    updates: Partial<{
      isHttps: boolean;
      isLocalhost: boolean;
      swActive: boolean;
      manifestFound: boolean;
      manifestReachable: boolean;
      manifestHref: string;
      installPromptFired: boolean;
      url: string;
      issue: string;
      nextStep: string;
    }>
  ) {
    const next = {
      ...this.diagnostics.value,
      ...updates,
      url: window.location.href,
    };

    const secureOrigin = next.isHttps || next.isLocalhost;
    let issue: string;
    let nextStep: string;

    if (!secureOrigin) {
      issue = 'Android Chrome blocks PWA install on non-HTTPS remote origins.';
      nextStep = 'Open the app over HTTPS, or test locally with localhost.';
    } else if (!next.manifestFound) {
      issue = 'No manifest link was detected in the document head.';
      nextStep = 'Check that Vite PWA injected a <link rel="manifest"> tag into the page.';
    } else if (!next.manifestReachable) {
      issue = 'The manifest link exists, but the URL does not resolve from this page.';
      nextStep = 'Compare the current URL and manifest URL below. A wrong BASE_PATH is the most likely cause.';
    } else if (!next.swActive) {
      issue = 'The manifest is present, but the service worker is not active yet.';
      nextStep = 'Reload once after the first visit and wait for the service worker to finish registering.';
    } else if (!next.installPromptFired) {
      issue = 'Installability checks have not produced a prompt yet.';
      nextStep = 'On Android, browse a little and wait; Chrome may defer the prompt even when the app is installable.';
    } else {
      issue = 'Install prerequisites look good.';
      nextStep = 'Use the Install App button or Chrome’s Add to Home screen action.';
    }

    this.diagnostics.value = {
      ...next,
      issue,
      nextStep,
    };
  }

  private async checkManifest() {
    const link = document.querySelector('link[rel="manifest"]') ||
      document.querySelector('link[rel="web-manifest"]') ||
      document.querySelector('link[rel="manifest.json"]');

    const manifestHref = link instanceof HTMLLinkElement ? link.href : '';

    if (!manifestHref) {
      this.updateDiagnostics({
        manifestFound: false,
        manifestReachable: false,
        manifestHref: '',
      });
      return false;
    }

    let manifestReachable: boolean;
    try {
      const response = await fetch(manifestHref, {
        method: 'GET',
        cache: 'no-store',
      });
      manifestReachable = response.ok;
    } catch {
      manifestReachable = false;
    }

    this.updateDiagnostics({
      manifestFound: true,
      manifestReachable,
      manifestHref,
    });

    return manifestReachable;
  }

  installPwa = async () => {
    if (!this.deferredPrompt) return;

    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    this.deferredPrompt = null;
    this.canInstall.value = false;

    this.updateDiagnostics({
      installPromptFired: outcome === 'accepted',
      issue: outcome === 'accepted'
        ? 'Install prompt accepted.'
        : 'Install prompt dismissed.',
      nextStep: outcome === 'accepted'
        ? 'Wait for Android to complete installation, then launch from the home screen.'
        : 'You can trigger the prompt again after Chrome makes it available.',
    });
  };
}
