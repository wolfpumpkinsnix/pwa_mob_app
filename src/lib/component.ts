import { effect } from '@preact/signals-core';

type Cleanup = () => void;
type CleanupBucket = Cleanup[];

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
      private _cleanupEffects: CleanupBucket = [];
      private _contentRoot?: HTMLElement;
      private _exprCache = new Map<string, (...args: any[]) => any>();
      private _loggedExpressionErrors = new Set<string>();
      private _templateBound = false;

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
          
          const contentRoot = document.createElement('div');
          contentRoot.style.display = 'contents';
          shadow.appendChild(contentRoot);
          this._contentRoot = contentRoot;
          this._renderTemplate();
        }
      }

      connectedCallback() {
        if (!this._templateBound) {
          this._renderTemplate();
          this._bindTemplate(this._contentRoot ?? (this.shadowRoot as ShadowRoot));
          this._templateBound = true;
        }
        
        if (typeof target.prototype.connectedCallback === 'function') {
          target.prototype.connectedCallback.call(this);
        }
      }

      disconnectedCallback() {
        this._runCleanups(this._cleanupEffects);
        this._cleanupEffects = [];
        this._templateBound = false;
        
        if (typeof target.prototype.disconnectedCallback === 'function') {
          target.prototype.disconnectedCallback.call(this);
        }
      }

      private _renderTemplate() {
        if (!this._contentRoot) return;

        this._contentRoot.replaceChildren();

        if (options.template) {
          const templateEl = document.createElement('template');
          templateEl.innerHTML = options.template;
          this._contentRoot.appendChild(templateEl.content.cloneNode(true));
        }
      }

      private _runCleanups(bucket: CleanupBucket) {
        while (bucket.length) {
          const cleanup = bucket.pop();
          try {
            cleanup?.();
          } catch (error) {
            if (import.meta.env.DEV) {
              console.warn(`[${options.selector}] Template cleanup failed.`, error);
            }
          }
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
            this._exprCache.set(cacheKey, new Function(...keys, `return ${expr}`) as (...args: any[]) => any);
          }
          const result = this._exprCache.get(cacheKey)!(...Object.values(context));
          
          // If the result is a signal, return its value
          if (result && typeof result.value !== 'undefined') {
            return result.value;
          }
          return result;
        } catch (error) {
          if (import.meta.env.DEV && !this._loggedExpressionErrors.has(expr)) {
            this._loggedExpressionErrors.add(expr);
            console.warn(
              `[${options.selector}] Failed to evaluate template expression "${expr}".`,
              error
            );
          }
          return '';
        }
      }

      private _bindTemplate(
        root: ShadowRoot | HTMLElement,
        localScope: any = {},
        cleanupBucket: CleanupBucket = this._cleanupEffects
      ) {
        if (!root) return;
        
        // 1. Event Listeners
        const elementsWithEvents = root.querySelectorAll('*');
        elementsWithEvents.forEach(el => {
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('(') && attr.name.endsWith(')')) {
              const eventName = attr.name.slice(1, -1);
              const methodName = attr.value;
              
              if (typeof (this as any)[methodName] === 'function') {
                const listener = (e: Event) => {
                  (this as any)[methodName](e);
                };
                el.addEventListener(eventName, listener);
                cleanupBucket.push(() => el.removeEventListener(eventName, listener));
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
            let renderCleanups: CleanupBucket = [];
            const cleanup = effect(() => {
              this._runCleanups(renderCleanups);
              renderCleanups = [];

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
                  this._bindTemplate(container, { ...localScope, [itemVar]: item }, renderCleanups);
                  loopEl.appendChild(container);
                });
              }
            });
            cleanupBucket.push(() => {
              cleanup();
              this._runCleanups(renderCleanups);
            });
          }
        });

        // 3. Handle Conditionals: <if-block>
        const ifBlocks = root.querySelectorAll('if-block');
        ifBlocks.forEach(ifEl => {
          const conditionExpr = ifEl.getAttribute('data-cond')!;
          const ifTemplate = ifEl.querySelector('template[data-type="if"]') as HTMLTemplateElement;
          const elseTemplate = ifEl.querySelector('template[data-type="else"]') as HTMLTemplateElement;

          let renderCleanups: CleanupBucket = [];
          const cleanup = effect(() => {
            this._runCleanups(renderCleanups);
            renderCleanups = [];

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
              this._bindTemplate(container, localScope, renderCleanups);
              ifEl.appendChild(container);
            }
          });
          cleanupBucket.push(() => {
            cleanup();
            this._runCleanups(renderCleanups);
          });
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
              cleanupBucket.push(cleanup);
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
          cleanupBucket.push(cleanup);
        });
      }
    }
    
    if (!customElements.get(options.selector)) {
      customElements.define(options.selector, WebComponent);
    }
    
    return WebComponent;
  };
}
