import { Component } from '../../lib/component';
import template from './title-bar.component.html?raw';
import styles from './title-bar.component.css?raw';

@Component({
  selector: 'title-bar',
  template,
  styles,
})
export class TitleBarComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if ('windowControlsOverlay' in navigator) {
      (navigator as any).windowControlsOverlay.addEventListener('geometrychange', (e: any) => {
        // You could react to geometry changes here if needed
        console.log('WCO Geometry changed:', e.titlebarAreaRect);
      });
    }
  }
}
