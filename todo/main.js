import { h, createStore, createApp } from "../framework/index.js"

const store = createStore({ count: 0, items: [] })

function view(state) {
  return h("div", {}, [
    h("p", {}, ["Count: " + state.count]),

    h("button", {
      on: { click: () => store.setState(s => ({ count: s.count + 1 })) }
    }, ["+1"]),

    h("button", {
      on: {
        click: () => store.setState(s => ({
          items: [...s.items, "item " + (s.items.length + 1)]
        }))
      }
    }, ["Add item"]),

    h("p", {}, ["Items: " + state.items.length + " (click one to remove it)"]),

    h("ul", {}, state.items.map((text, i) =>
      h("li", {
        on: {
          click: () => store.setState(s => ({
            items: s.items.filter((_, j) => j !== i)
          }))
        }
      }, [text])
    ))
  ])
}

createApp({ root: document.getElementById("app"), store, view })