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
      private _exprCache = new Map<string, Function>();

      constructor(...args: any[]) {
        super(...args);
        
        if (!this.shadowRoot) {
          const shadow = this.attachShadow({ mode: 'open' });
          
          if (options.styles) {
            const style = document.createElement('style');
            style.textContent = options.styles;
            shadow.appendChild(style);
          }
          
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
        this._bindTemplate(this.shadowRoot as any);
        
        if (typeof target.prototype.connectedCallback === 'function') {
          target.prototype.connectedCallback.call(this);
        }
      }

      disconnectedCallback() {
        this._cleanupEffects.forEach(cleanup => cleanup());
        this._cleanupEffects = [];
        
        if (typeof target.prototype.disconnectedCallback === 'function') {
          target.prototype.disconnectedCallback.call(this);
        }
      }

      private _evaluateExpression(expr: string, localScope: any): any {
        const context: any = { ...localScope };
        // Merge component properties
        Object.keys(this).forEach(key => {
          if (key.startsWith('_')) return;
          context[key] = (this as any)[key];
        });

        try {
          const keys = Object.keys(context);
          const cacheKey = `${keys.join(',')}|${expr}`;
          if (!this._exprCache.has(cacheKey)) {
            this._exprCache.set(cacheKey, new Function(...keys, `return ${expr}`));
          }
          const result = this._exprCache.get(cacheKey)!(...Object.values(context));
          
          // If the result is a signal, return its value
          if (result && typeof result.value !== 'undefined') {
            return result.value;
          }
          return result;
        } catch (e) {
          return '';
        }
      }

      private _bindTemplate(root: ShadowRoot | HTMLElement, localScope: any = {}) {
        if (!root) return;
        
        // 1. Event Listeners
        const elementsWithEvents = root.querySelectorAll('*');
        elementsWithEvents.forEach(el => {
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('(') && attr.name.endsWith(')')) {
              const eventName = attr.name.slice(1, -1);
              const methodName = attr.value;
              
              if (typeof (this as any)[methodName] === 'function') {
                el.addEventListener(eventName, (e) => {
                  (this as any)[methodName](e);
                });
              }
              el.removeAttribute(attr.name);
            }
          });
        });

        // 2. Handle Loops: <for-loop>
        const loops = root.querySelectorAll('for-loop');
        loops.forEach(loopEl => {
          const listName = loopEl.getAttribute('data-list')!;
          const itemVar = loopEl.getAttribute('data-item')!;
          const template = loopEl.querySelector('template');
          if (!template) return;

          const listSignal = (this as any)[listName];
          if (listSignal) {
            const cleanup = effect(() => {
              Array.from(loopEl.childNodes).forEach(node => {
                if (node !== template) loopEl.removeChild(node);
              });

              const list = listSignal.value || listSignal;
              if (Array.isArray(list)) {
                list.forEach(item => {
                  const clone = template.content.cloneNode(true) as DocumentFragment;
                  const container = document.createElement('div');
                  container.style.display = 'contents';
                  container.appendChild(clone);
                  this._bindTemplate(container, { ...localScope, [itemVar]: item });
                  loopEl.appendChild(container);
                });
              }
            });
            this._cleanupEffects.push(cleanup);
          }
        });

        // 3. Handle Conditionals: <if-block>
        const ifBlocks = root.querySelectorAll('if-block');
        ifBlocks.forEach(ifEl => {
          const conditionExpr = ifEl.getAttribute('data-cond')!;
          const ifTemplate = ifEl.querySelector('template[data-type="if"]') as HTMLTemplateElement;
          const elseTemplate = ifEl.querySelector('template[data-type="else"]') as HTMLTemplateElement;

          const cleanup = effect(() => {
            // Clear existing content
            Array.from(ifEl.childNodes).forEach(node => {
              if (node !== ifTemplate && node !== elseTemplate) ifEl.removeChild(node);
            });

            const result = !!this._evaluateExpression(conditionExpr, localScope);
            const templateToUse = result ? ifTemplate : elseTemplate;

            if (templateToUse) {
              const clone = templateToUse.content.cloneNode(true) as DocumentFragment;
              const container = document.createElement('div');
              container.style.display = 'contents';
              container.appendChild(clone);
              this._bindTemplate(container, localScope);
              ifEl.appendChild(container);
            }
          });
          this._cleanupEffects.push(cleanup);
        });

        // 4. Attribute interpolation
        const allElements = root.querySelectorAll('*');
        allElements.forEach(el => {
          Array.from(el.attributes).forEach(attr => {
            if (attr.value.includes('{{')) {
              const originalValue = attr.value;
              const cleanup = effect(() => {
                const newValue = originalValue.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (_, expr) => {
                  return String(this._evaluateExpression(expr, localScope));
                });
                el.setAttribute(attr.name, newValue);
              });
              this._cleanupEffects.push(cleanup);
            }
          });
        });

        // 5. Text interpolation
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let node;
        const textNodes: { node: Text; originalText: string }[] = [];
        while ((node = walker.nextNode())) {
          if (node.nodeValue && node.nodeValue.includes('{{')) {
            textNodes.push({ node: node as Text, originalText: node.nodeValue });
          }
        }

        textNodes.forEach(({ node, originalText }) => {
          const cleanup = effect(() => {
            node.nodeValue = originalText.replace(/\{\{\s*([\s\S]+?)\s*\}\}/g, (_, expr) => {
              return String(this._evaluateExpression(expr, localScope));
            });
          });
          this._cleanupEffects.push(cleanup);
        });
      }
    }
    
    if (!customElements.get(options.selector)) {
      customElements.define(options.selector, WebComponent);
    }
    
    return WebComponent;
  };
}
