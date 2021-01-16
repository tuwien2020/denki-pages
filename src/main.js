import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import { name, version } from "./../package.json";
import 'bulma/css/bulma.css';

if (import.meta.env.PROD) {
  console.log(`${name} - ${version}`);
}

createApp(App).mount("#app");
