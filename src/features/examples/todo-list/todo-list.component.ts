import { Component } from '../../../lib/component';
import { signal } from '@preact/signals-core';
import template from './todo-list.component.html?raw';
import styles from './todo-list.component.css?raw';

@Component({
  selector: 'todo-list',
  template,
  styles,
})
export class TodoListComponent extends HTMLElement {
  tasks = signal([
    { id: 1, text: 'Learn Web Components', done: true },
    { id: 2, text: 'Build a PWA', done: false },
    { id: 3, text: 'Add @for support', done: false }
  ]);

  addTask = () => {
    const input = this.shadowRoot?.getElementById('taskInput') as HTMLInputElement;
    if (input && input.value) {
      this.tasks.value = [...this.tasks.value, { 
        id: Date.now(), 
        text: input.value, 
        done: false 
      }];
      input.value = '';
    }
  };

  toggleTask = (e: Event) => {
    const id = (e.target as HTMLButtonElement).getAttribute('data-id');
    if (id) {
      this.tasks.value = this.tasks.value.map(t => 
        t.id.toString() === id ? { ...t, done: !t.done } : t
      );
    }
  };
}
