import { createApp, initRouter } from "../framework/index.js"
import { store } from "./store.js"
import { view } from "./view.js"

initRouter(store)
createApp({ root: document.getElementById("root"), store, view })