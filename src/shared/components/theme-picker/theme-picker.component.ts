import { Component } from '../../../lib/component';
import { effect, signal } from '@preact/signals-core';
import {
  setThemePreference,
  THEME_PALETTES,
  themePreference,
  type ThemePreference,
} from '../../../core/theme';
import template from './theme-picker.component.html?raw';
import styles from './theme-picker.component.css?raw';

type ThemeOption = {
  value: ThemePreference;
  label: string;
  mode: 'System' | 'Light' | 'Dark';
  color: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'system',
    label: 'System',
    mode: 'System',
    color: 'linear-gradient(135deg, #ffffff 0 50%, #16171d 50% 100%)',
  },
  {
    value: 'light',
    label: 'Light',
    mode: 'Light',
    color: THEME_PALETTES.light.primary,
  },
  {
    value: 'green',
    label: 'Green',
    mode: 'Light',
    color: THEME_PALETTES.green.primary,
  },
  {
    value: 'dark',
    label: 'Dark',
    mode: 'Dark',
    color: THEME_PALETTES.dark.primary,
  },
];

@Component({
  selector: 'theme-picker',
  template,
  styles,
})
export class ThemePickerComponent extends HTMLElement {
  private disposeThemeSync?: () => void;
  private removeDocumentListener?: () => void;
  isOpen = signal(false);
  selectedTheme = signal<ThemeOption>(THEME_OPTIONS[0]);
  lightThemes = THEME_OPTIONS.filter(option => option.mode === 'Light');
  darkThemes = THEME_OPTIONS.filter(option => option.mode === 'Dark');
  systemTheme = THEME_OPTIONS.find(option => option.value === 'system')!;

  connectedCallback() {
    this.disposeThemeSync?.();
    this.disposeThemeSync = effect(() => {
      this.selectedTheme.value = this.getThemeOption(themePreference.value);
    });

    const onDocumentPointerDown = (event: PointerEvent) => {
      if (!this.contains(event.target as Node) && !event.composedPath().includes(this)) {
        this.isOpen.value = false;
      }
    };
    document.addEventListener('pointerdown', onDocumentPointerDown);
    this.removeDocumentListener = () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
    };
  }

  disconnectedCallback() {
    this.disposeThemeSync?.();
    this.disposeThemeSync = undefined;
    this.removeDocumentListener?.();
    this.removeDocumentListener = undefined;
  }

  toggleMenu = () => {
    this.isOpen.value = !this.isOpen.value;
  };

  selectTheme = (e: Event) => {
    const button = e.currentTarget as HTMLButtonElement;
    setThemePreference(button.dataset.theme ?? 'system');
    this.isOpen.value = false;
  };

  isSelected = (theme: ThemePreference) => this.selectedTheme.value.value === theme;

  private getThemeOption(theme: ThemePreference) {
    return THEME_OPTIONS.find(option => option.value === theme) ?? THEME_OPTIONS[0];
  }
}
