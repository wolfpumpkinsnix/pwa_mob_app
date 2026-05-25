import { Component } from '../../lib/component';
import { effect, signal } from '@preact/signals-core';
import template from './pwa-diagnostics.component.html?raw';
import styles from './pwa-diagnostics.component.css?raw';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type ManifestIcon = {
  sizes?: string;
};

type WebAppManifest = {
  name?: string;
  short_name?: string;
  icons?: ManifestIcon[];
  start_url?: string;
  scope?: string;
  display?: string;
  prefer_related_applications?: boolean;
};

type DiagnosticsState = {
  isHttps: boolean;
  isLocalhost: boolean;
  isSecureContext: boolean;
  hasServiceWorkerSupport: boolean;
  swActive: boolean;
  swScope: string;
  manifestFound: boolean;
  manifestReachable: boolean;
  manifestHasRequiredFields: boolean;
  manifestAttrHref: string;
  manifestHref: string;
  manifestStartUrl: string;
  manifestScope: string;
  manifestDisplay: string;
  manifestIconSizes: string;
  baseUri: string;
  headLinks: string;
  installPromptFired: boolean;
  url: string;
  issue: string;
  nextStep: string;
};

const installableDisplays = new Set([
  'fullscreen',
  'standalone',
  'minimal-ui',
  'window-controls-overlay',
]);

@Component({
  selector: 'pwa-diagnostics',
  template,
  styles,
})
export class PwaDiagnosticsComponent extends HTMLElement {
  canInstall = signal(false);
  deferredPrompt: InstallPromptEvent | null = null;
  private _manifestObserver?: MutationObserver;

  diagnostics = signal<DiagnosticsState>({
    isHttps: window.location.protocol === 'https:',
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isSecureContext: window.isSecureContext,
    hasServiceWorkerSupport: 'serviceWorker' in navigator,
    swActive: false,
    swScope: '',
    manifestFound: false,
    manifestReachable: false,
    manifestHasRequiredFields: false,
    manifestAttrHref: '',
    manifestHref: '',
    manifestStartUrl: '',
    manifestScope: '',
    manifestDisplay: '',
    manifestIconSizes: '',
    baseUri: document.baseURI,
    headLinks: '',
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
      void this.checkServiceWorker();
      navigator.serviceWorker.ready.then((reg) => {
        this.updateDiagnostics({
          swActive: !!reg.active,
          swScope: reg.scope,
        });
      });
    }
  }

  connectedCallback() {
    void this.checkManifest();
    void this.checkServiceWorker();

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

  private updateDiagnostics(updates: Partial<DiagnosticsState>) {
    const headLinks = Array.from(document.head.querySelectorAll('link'))
      .map((node, index) => {
        const rel = node.getAttribute('rel') ?? '(no rel)';
        const href = node.getAttribute('href') ?? '(no href)';
        return `${index + 1}. rel=${rel} href=${href}`;
      })
      .join(' | ');

    const next = {
      ...this.diagnostics.value,
      ...updates,
      url: window.location.href,
      baseUri: document.baseURI,
      headLinks,
    };

    let issue: string;
    let nextStep: string;

    if (!next.isSecureContext) {
      issue = 'Android Chrome blocks PWA install on non-HTTPS remote origins.';
      nextStep = 'Open the app over HTTPS. A phone visiting a local LAN IP over HTTP is not a secure context.';
    } else if (!next.hasServiceWorkerSupport) {
      issue = 'This browser does not expose service worker support.';
      nextStep = 'Test in Chrome or another Android browser with PWA support.';
    } else if (!next.manifestFound) {
      issue = 'No manifest link was detected in the document head.';
      nextStep = 'Check that vite-plugin-pwa injected a manifest link into the built page.';
    } else if (!next.manifestReachable) {
      issue = 'The manifest link exists, but the URL does not resolve from this page.';
      nextStep = 'Compare the current URL and manifest URL below. A wrong BASE_PATH is the most likely cause.';
    } else if (!next.manifestHasRequiredFields) {
      issue = 'The manifest is reachable, but it is missing an Android installability field.';
      nextStep = 'Confirm name, start_url, display, prefer_related_applications, and 192x192 plus 512x512 icons below.';
    } else if (!next.swActive) {
      issue = 'The manifest is present, but the service worker is not active yet.';
      nextStep = 'Reload once after the first visit and wait for the service worker to finish registering.';
    } else if (!next.installPromptFired) {
      issue = 'Installability checks have not produced a prompt yet.';
      nextStep = 'Tap the page and keep it open for at least 30 seconds; Chrome may defer beforeinstallprompt even when the menu install works.';
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
    const manifestAttrHref = link instanceof HTMLLinkElement ? link.getAttribute('href') ?? '' : '';

    if (!manifestHref) {
      this.updateDiagnostics({
        manifestFound: false,
        manifestReachable: false,
        manifestAttrHref: '',
        manifestHref: '',
      });
      return false;
    }

    let manifestReachable: boolean;
    let manifest: WebAppManifest | null = null;
    try {
      const response = await fetch(manifestHref, {
        method: 'GET',
        cache: 'no-store',
      });
      manifestReachable = response.ok;
      if (response.ok) {
        manifest = await response.json() as WebAppManifest;
      }
    } catch {
      manifestReachable = false;
    }

    const manifestDetails = this.getManifestDetails(manifest);

    this.updateDiagnostics({
      manifestFound: true,
      manifestReachable,
      manifestHasRequiredFields: manifestDetails.hasRequiredFields,
      manifestAttrHref,
      manifestHref,
      manifestStartUrl: manifestDetails.startUrl,
      manifestScope: manifestDetails.scope,
      manifestDisplay: manifestDetails.display,
      manifestIconSizes: manifestDetails.iconSizes,
    });

    return manifestReachable;
  }

  private async checkServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      this.updateDiagnostics({
        hasServiceWorkerSupport: false,
        swActive: false,
        swScope: '',
      });
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      this.updateDiagnostics({
        hasServiceWorkerSupport: true,
        swActive: !!registration?.active || !!navigator.serviceWorker.controller,
        swScope: registration?.scope ?? '',
      });
    } catch {
      this.updateDiagnostics({
        hasServiceWorkerSupport: true,
        swActive: false,
        swScope: '',
      });
    }
  }

  private getManifestDetails(manifest: WebAppManifest | null) {
    const iconSizes = (manifest?.icons ?? [])
      .flatMap((icon) => icon.sizes?.split(/\s+/).filter(Boolean) ?? []);

    const display = manifest?.display ?? '';
    const hasRequiredFields = !!(
      manifest &&
      (manifest.name || manifest.short_name) &&
      manifest.start_url &&
      installableDisplays.has(display) &&
      manifest.prefer_related_applications !== true &&
      iconSizes.includes('192x192') &&
      iconSizes.includes('512x512')
    );

    return {
      hasRequiredFields,
      startUrl: manifest?.start_url ?? '',
      scope: manifest?.scope ?? '',
      display,
      iconSizes: iconSizes.join(', '),
    };
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
