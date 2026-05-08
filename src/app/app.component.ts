import { Component } from "../lib/component";
import { signal } from "@preact/signals-core";
import template from "./app.component.html?raw";
import styles from "./app.component.css?raw";

@Component({
  selector: "app-root",
  template,
  styles,
})
export class AppComponent extends HTMLElement {
  // Define a reactive signal
  count = signal(0);

  // The event listener from (click)="increment" in the template will call this
  increment = () => {
    this.count.value++;
  };
}
