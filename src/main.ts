import './style.css';
import './shared/components/theme-picker/theme-picker.component';
import './shared/components/title-bar/title-bar.component';
import './features/examples/examples-view/examples-view.component';
import './features/pwa-diagnostics/pwa-diagnostics.component';
import './app/app.component';
import { setupPwa } from './core/pwa';
import { setupTheme } from './core/theme';

setupTheme();
setupPwa();
