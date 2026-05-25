import { signal, effect } from '@preact/signals-core';

export type ThemePreference = 'system' | 'light' | 'dark' | 'green';
export type ThemeName = 'light' | 'dark' | 'green';
export type ThemeColor =
  | 'base'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

const STORAGE_KEY = 'theme';

export const THEME_PALETTES: Record<ThemeName, Record<ThemeColor, string>> = {
  light: {
    base: '#ffffff',
    primary: '#aa3bff',
    secondary: '#0ea5e9',
    accent: '#aa3bff',
    neutral: '#6b6375',
    info: '#0284c7',
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
  },
  dark: {
    base: '#16171d',
    primary: '#c084fc',
    secondary: '#38bdf8',
    accent: '#c084fc',
    neutral: '#9ca3af',
    info: '#60a5fa',
    success: '#4ade80',
    warning: '#facc15',
    error: '#f87171',
  },
  green: {
    base: '#f2fbf5',
    primary: '#137a4b',
    secondary: '#0f766e',
    accent: '#137a4b',
    neutral: '#4b6355',
    info: '#0891b2',
    success: '#15803d',
    warning: '#ca8a04',
    error: '#dc2626',
  },
};

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

export const themePreference = signal<ThemePreference>(readThemePreference());
export const resolvedTheme = signal<ThemeName>(resolveTheme(themePreference.value));

let isThemeSetup = false;

export function setupTheme() {
  if (isThemeSetup) return;
  isThemeSetup = true;

  effect(() => {
    const preference = themePreference.value;
    persistThemePreference(preference);
    applyTheme(resolveTheme(preference));
  });

  mediaQuery.addEventListener('change', () => {
    if (themePreference.value === 'system') {
      applyTheme(resolveTheme('system'));
    }
  });
}

export function setThemePreference(preference: string) {
  themePreference.value = normalizeThemePreference(preference);
}

function readThemePreference(): ThemePreference {
  try {
    return normalizeThemePreference(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'system';
  }
}

function persistThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }
}

function normalizeThemePreference(preference: string | null): ThemePreference {
  if (
    preference === 'light' ||
    preference === 'dark' ||
    preference === 'green' ||
    preference === 'system'
  ) {
    return preference;
  }

  return 'system';
}

function resolveTheme(preference: ThemePreference): ThemeName {
  if (preference === 'system') {
    return mediaQuery.matches ? 'dark' : 'light';
  }

  return preference;
}

function applyTheme(theme: ThemeName) {
  resolvedTheme.value = theme;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  updateThemeColor(theme);
}

function updateThemeColor(theme: ThemeName) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  meta?.setAttribute('content', THEME_PALETTES[theme].base);
}
