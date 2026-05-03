import { effect } from '@preact/signals-core';

export interface ComponentOptions {
  selector: string;
  template?: string;
  styles?: string;
}

export function Component(options: ComponentOptions) {
  return function <T extends { new (...args: any[]): HTMLElement }>(
    target: T,
    _context?: ClassDecoratorContext<T>
  ) {
    class WebComponent extends target {
      private _cleanupEffects: (() => void)[] = [];

      constructor(...args: any[]) {
        super(...args);
        
        if (!this.shadowRoot) {
          const shadow = this.attachShadow({ mode: 'open' });
          
          if (options.styles) {
            const style = document.createElement('style');
            style.textContent = options.styles;
            shadow.appendChild(style);
          }
          
          // Inject UnoCSS global styles into every component
          const unoStyle = document.createElement('style');
          unoStyle.textContent = `\n@unocss-placeholder\n`;
          shadow.appendChild(unoStyle);
          
          if (options.template) {
            const templateEl = document.createElement('template');
            templateEl.innerHTML = options.template;
            shadow.appendChild(templateEl.content.cloneNode(true));
          }
        }
      }

      connectedCallback() {
        this._bindTemplate();
        
        // Call original connectedCallback if it exists on the target prototype
        if (typeof target.prototype.connectedCallback === 'function') {
          target.prototype.connectedCallback.call(this);
        }
      }

      disconnectedCallback() {
        this._cleanupEffects.forEach(cleanup => cleanup());
        this._cleanupEffects = [];
        
        // Call original disconnectedCallback if it exists
        if (typeof target.prototype.disconnectedCallback === 'function') {
          target.prototype.disconnectedCallback.call(this);
        }
      }

      private _bindTemplate() {
        if (!this.shadowRoot) return;
        
        // 1. Event Listeners: (click)="methodName"
        const elementsWithEvents = this.shadowRoot.querySelectorAll('*');
        elementsWithEvents.forEach(el => {
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('(') && attr.name.endsWith(')')) {
              const eventName = attr.name.slice(1, -1); // e.g. "click"
              const methodName = attr.value;
              
              if (typeof (this as any)[methodName] === 'function') {
                el.addEventListener(eventName, (e) => {
                  (this as any)[methodName](e);
                });
              }
              // Clean up attribute
              el.removeAttribute(attr.name);
            }
          });
        });

        // 2. Text interpolation: {{ signalName }}
        const walker = document.createTreeWalker(this.shadowRoot, NodeFilter.SHOW_TEXT, null);
        let node;
        const textNodes: { node: Text; originalText: string }[] = [];
        
        while ((node = walker.nextNode())) {
          if (node.nodeValue && node.nodeValue.includes('{{')) {
            textNodes.push({ node: node as Text, originalText: node.nodeValue });
          }
        }

        textNodes.forEach(({ node, originalText }) => {
          // Find all {{ var }}
          const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
          let match;
          const signalsToWatch = new Set<string>();
          
          while ((match = regex.exec(originalText)) !== null) {
            signalsToWatch.add(match[1]);
          }

          if (signalsToWatch.size > 0) {
            // Setup an effect to update this text node whenever any of its signals change
            const cleanup = effect(() => {
              let newText = originalText;
              for (const propName of signalsToWatch) {
                const propValue = (this as any)[propName];
                
                let valueToRender = '';
                if (propValue !== undefined && propValue !== null) {
                  // Check if it's a signal (has a .value property that triggers tracking)
                  valueToRender = propValue.value !== undefined ? propValue.value : propValue;
                }
                
                newText = newText.replace(new RegExp(`\\{\\{\\s*${propName}\\s*\\}\\}`, 'g'), String(valueToRender));
              }
              node.nodeValue = newText;
            });
            this._cleanupEffects.push(cleanup);
          }
        });
      }
    }
    
    // Register custom element
    if (!customElements.get(options.selector)) {
      customElements.define(options.selector, WebComponent);
    }
    
    return WebComponent;
  };
}
