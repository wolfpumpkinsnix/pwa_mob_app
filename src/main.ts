import './style.css';
import './components/theme-picker/theme-picker.component';
import './components/title-bar/title-bar.component';
import './app/app.component';

import { registerSW } from 'virtual:pwa-register';

registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});
