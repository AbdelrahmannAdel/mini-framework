import { h, mount } from "../framework/index.js"

const tree = h("div", { class: "nameSubm" }, [
  h("h1", {}, ["mini-framework"]),
  h("input", { type: "text", placeholder: "Insert Name" }),
  h("input", { type: "submit", value: "Submit" }),
  h("ul", {}, [
    h("li", { class: "item" }, ["one"]),
    h("li", { class: "item" }, ["two"])
  ])
])

mount(tree, document.getElementById("app"))