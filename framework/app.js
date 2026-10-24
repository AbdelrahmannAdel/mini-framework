import { mount } from "./dom.js"
import { patch } from "./diff.js"

// Connects a store to a view function. After this call the FRAMEWORK
// decides when view(state) runs: once now, then after every setState.
export function createApp({ root, store, view }) {
  let oldVnode = null

  function render() {
    const newVnode = view(store.getState())
    if (oldVnode === null) mount(newVnode, root) // first render: build everything
    else patch(root, oldVnode, newVnode)         // afterwards: only the differences
    oldVnode = newVnode
  }

  store.subscribe(render)
  render()
}