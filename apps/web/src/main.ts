import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/router";
import { createPinia } from "pinia";

import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/message/style/css";

const pinia = createPinia();
createApp(App).use(router).use(pinia).mount("#app");
