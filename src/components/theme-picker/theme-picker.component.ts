import { Component } from '../../lib/component';
import { signal, effect } from '@preact/signals-core';
import template from './theme-picker.component.html?raw';

@Component({
  selector: 'theme-picker',
  template,
})
export class ThemePickerComponent extends HTMLElement {
  theme = signal('light');
  
  // We compute these for template bindings to set 'selected' attribute
  lightSelected = '';
  darkSelected = '';

  constructor() {
    super();
    // Load theme from localStorage or default to light
    const storedTheme = localStorage.getItem('theme') || 'light';
    this.theme.value = storedTheme;
  }

  connectedCallback() {
    // Watch theme changes
    effect(() => {
      const currentTheme = this.theme.value;
      
      // Update data attribute on root HTML element
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('theme', currentTheme);

      // Update computed properties for the template
      // Note: Because our simple template system replaces {{var}} with the value ONCE at render,
      // dynamically updating attributes like 'selected' across options is a bit tricky.
      // Instead, we can just sync the <select> element's value directly.
      const selectEl = this.shadowRoot?.querySelector('select');
      if (selectEl) {
        selectEl.value = currentTheme;
      }
    });
  }

  onChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    this.theme.value = select.value;
  };
}
