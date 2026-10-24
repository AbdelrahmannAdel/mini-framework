import { mount } from "./dom.js"

// Connects a store to a view function. After this call the FRAMEWORK
// decides when view(state) runs: once now, then after every setState.
export function createApp({ root, store, view }) {
  function render() {
    mount(view(store.getState()), root)
  }

  store.subscribe(render)
  render()
}