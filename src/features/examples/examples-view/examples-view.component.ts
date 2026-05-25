import { signal } from '@preact/signals-core';
import { Component } from '../../../lib/component';
import '../todo-list/todo-list.component';
import template from './examples-view.component.html?raw';
import styles from './examples-view.component.css?raw';

@Component({
  selector: 'examples-view',
  template,
  styles,
})
export class ExamplesViewComponent extends HTMLElement {
  count = signal(0);

  increment = () => {
    this.count.value++;
  };
}
