import { Component } from '../lib/component';
import { signal, effect } from '@preact/signals-core';
import template from './app.component.html?raw';
import styles from './app.component.css?raw';

@Component({
  selector: 'app-root',
  template,
  styles
})
export class AppComponent extends HTMLElement {
  // Define a reactive signal
  count = signal(0);
  canInstall = signal(false);
  deferredPrompt: any = null;

  constructor() {
    super();
    
    // Listen for the install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.value = true;
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.value = false;
      console.log('PWA was installed');
    });

    // Use a reactive effect to show/hide the button
    effect(() => {
      const btn = this.shadowRoot?.getElementById('install-btn');
      if (btn) {
        btn.style.display = this.canInstall.value ? 'inline-block' : 'none';
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
    const btn = this.shadowRoot?.getElementById('install-btn');
    if (btn) btn.style.display = 'none';
  };

  // The event listener from (click)="increment" in the template will call this
  increment = () => {
    this.count.value++;
  };
}
