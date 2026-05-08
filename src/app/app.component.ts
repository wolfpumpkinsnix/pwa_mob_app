import { Component } from "../lib/component";
import { signal, effect } from "@preact/signals-core";
import template from "./app.component.html?raw";
import styles from "./app.component.css?raw";

@Component({
  selector: "app-root",
  template,
  styles,
})
export class AppComponent extends HTMLElement {
  // Define a reactive signal
  count = signal(0);
  canInstall = signal(false);
  deferredPrompt: any = null;
  diagnostics = signal({
    isHttps: window.location.protocol === 'https:',
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    swActive: false,
    manifestFound: !!document.querySelector('link[rel="manifest"]') || !!document.querySelector('link[rel="manifest.json"]'),
    installPromptFired: false,
    url: window.location.href
  });

  constructor() {
    super();

    // Listen for the install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.value = true;
      this.diagnostics.value = { ...this.diagnostics.value, installPromptFired: true };
    });

    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null;
      this.canInstall.value = false;
    });

    // Check service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        this.diagnostics.value = { ...this.diagnostics.value, swActive: !!reg.active };
      });
    }
  }
  connectedCallback() {
    // Robust manifest detection using MutationObserver
    const checkManifest = () => {
      const links = Array.from(document.querySelectorAll('link'));
      console.log('[PWA Diagnostic] All head links:', links.map(l => ({ rel: l.rel, href: l.href })));
      console.log('[PWA Diagnostic] Current URL:', window.location.href);

      const link = document.querySelector('link[rel="manifest"]') || 
                   document.querySelector('link[rel="web-manifest"]') ||
                   document.querySelector('link[rel="manifest.json"]');
      
      if (link) {
        console.log('[PWA Diagnostic] Manifest link found:', link.getAttribute('href'));
        this.diagnostics.value = { 
          ...this.diagnostics.value, 
          manifestFound: true,
          url: window.location.href
        };
        return true;
      }
      return false;
    };

    if (!checkManifest()) {
      const observer = new MutationObserver(() => {
        if (checkManifest()) observer.disconnect();
      });
      observer.observe(document.head, { childList: true, subtree: true });
      
      // Fallback timeout
      setTimeout(() => observer.disconnect(), 5000);
    }

    // Use a reactive effect to show/hide the button
    // We subscribe to the signal at the start of the effect to ensure it re-runs
    effect(() => {
      const canInstall = this.canInstall.value;
      const btn = this.shadowRoot?.getElementById("install-btn");
      if (btn) {
        btn.style.display = canInstall ? "inline-block" : "none";
      }
    });
  }

  installPwa = async () => {
    if (!this.deferredPrompt) return;

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    this.deferredPrompt = null;
    this.canInstall.value = false;
    const btn = this.shadowRoot?.getElementById("install-btn");
    if (btn) btn.style.display = "none";
  };

  // The event listener from (click)="increment" in the template will call this
  increment = () => {
    this.count.value++;
  };
}
