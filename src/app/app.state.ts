import { signal } from '@preact/signals-core';

export type AppView = 'home' | 'examples' | 'diagnostics';

export const activeView = signal<AppView>('home');
