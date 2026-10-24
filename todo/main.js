import { h, createStore, createApp, initRouter } from "../framework/index.js"

const store = createStore({
  route: "/",
  text: "",
  count: 0,
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
    h("input", {
      placeholder: "type here",
      on: { input: (e) => store.setState({ text: e.target.value }) }
    }),
    h("p", {}, ["You typed: " + state.text]),

    h("button", {
      on: { click: () => store.setState(s => ({ count: s.count + 1 })) }
    }, ["+1 (" + state.count + ")"]),

    h("p", {}, [
      h("a", { href: "#/" }, ["All"]), " | ",
      h("a", { href: "#/active" }, ["Active"]), " | ",
      h("a", { href: "#/completed" }, ["Completed"])
    ]),

    h("ul", {}, visibleItems(state).map(item =>
      h("li", { on: { click: () => toggle(item) } },
        [item.text + (item.done ? " (done)" : "")])
    ))
  ])
}

initRouter(store)
createApp({ root: document.getElementById("app"), store, view })