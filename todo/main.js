import { h, createStore, createApp, initRouter, navigate } from "../framework/index.js"

const store = createStore({
  route: "/",
  items: [
    { text: "one", done: false },
    { text: "two", done: true },
    { text: "three", done: false }
  ]
})

function visibleItems(state) {
  if (state.route === "/active") return state.items.filter(i => !i.done)
  if (state.route === "/completed") return state.items.filter(i => i.done)
  return state.items
}

function toggle(item) {
  store.setState(s => ({
    items: s.items.map(i => (i === item ? { ...i, done: !i.done } : i))
  }))
}

function view(state) {
  return h("div", {}, [
    h("p", {}, ["Route: " + state.route]),

    h("p", {}, [
      h("a", { href: "#/" }, ["All"]), " | ",
      h("a", { href: "#/active" }, ["Active"]), " | ",
      h("a", { href: "#/completed" }, ["Completed"])
    ]),

    h("button", { on: { click: () => navigate("/completed") } },
      ["Go to Completed (button)"]),

    h("ul", {}, visibleItems(state).map(item =>
      h("li", { on: { click: () => toggle(item) } },
        [item.text + (item.done ? " (done)" : "")])
    ))
  ])
}

initRouter(store)
createApp({ root: document.getElementById("app"), store, view })