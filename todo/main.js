import { h, mount } from "../framework/index.js"

let clicks = 0

const tree = h("div", { class: "demo" }, [
  h("button", {
    id: "btn",
    on: {
      click: (e) => {
        clicks++
        e.target.textContent = "Clicked " + clicks
      }
    }
  }, ["Click me"]),

  h("input", {
    type: "text",
    placeholder: "type, Enter, Escape",
    on: {
      input: (e) => console.log("input:", e.target.value),
      keydown: (e) => {
        if (e.key === "Enter") console.log("enter")
        if (e.key === "Escape") console.log("escape")
      },
      blur: () => console.log("blur")
    }
  }),

  h("p", {
    on: { dblclick: () => console.log("double clicked") }
  }, ["Double-click me"])
])

mount(tree, document.getElementById("app"))