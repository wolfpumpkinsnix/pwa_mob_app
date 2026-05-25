import { Component } from "../lib/component";
import { activeView, type AppView } from "./app.state";
import template from "./app.component.html?raw";
import styles from "./app.component.css?raw";

@Component({
  selector: "app-root",
  template,
  styles,
})
export class AppComponent extends HTMLElement {
  activeView = activeView;

  setView = (e: Event) => {
    const view = (e.currentTarget as HTMLButtonElement).dataset.view as AppView | undefined;
    if (view) {
      this.activeView.value = view;
    }
  };

  isView = (view: AppView) => this.activeView.value === view;
}
