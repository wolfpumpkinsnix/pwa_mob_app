import { defineConfig, presetUno } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
  ],
  theme: {
    colors: {
      bg: 'var(--bg)',
      text: 'var(--text)',
      primary: 'var(--accent)',
      border: 'var(--border)'
    }
  }
});
