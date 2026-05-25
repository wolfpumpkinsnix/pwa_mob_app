import { defineConfig, presetWind4 } from 'unocss';

export default defineConfig({
  presets: [
    presetWind4(),
  ],
  theme: {
    colors: {
      base: 'var(--base)',
      bg: 'var(--bg)',
      text: 'var(--text)',
      primary: 'var(--primary)',
      secondary: 'var(--secondary)',
      accent: 'var(--accent)',
      neutral: 'var(--neutral)',
      info: 'var(--info)',
      success: 'var(--success)',
      warning: 'var(--warning)',
      error: 'var(--error)',
      border: 'var(--border)'
    }
  }
});
