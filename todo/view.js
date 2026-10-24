import { h } from "../framework/index.js"
import {
  addTodo, toggleTodo, removeTodo, toggleAll, clearCompleted,
  startEditing, stopEditing, commitEdit, visibleTodos
} from "./store.js"

// { completed: true, editing: false } -> "completed", or null if nothing applies
const classes = (flags) =>
  Object.keys(flags).filter((k) => flags[k]).join(" ") || null

function Header() {
  return h("header", { class: "header", "data-testid": "header" }, [
    h("h1", {}, ["todos"]),
    h("input", {
      class: "new-todo",
      type: "text",
      "data-testid": "text-input",
      autofocus: true,
      "aria-label": "New Todo Input",
      placeholder: "What needs to be done?",
      on: {
        keydown: (e) => {
          if (e.key !== "Enter") return
          const title = e.target.value.trim()
          if (title === "") return
          addTodo(title)
          e.target.value = ""
        }
      }
    })
  ])
}

function EditInput(todo) {
  return h("input", {
    class: "edit",
    type: "text",
    "data-testid": "text-input",
    autofocus: true,
    "aria-label": "Edit todo",
    value: todo.title,
    on: {
      keydown: (e) => {
        if (e.key === "Enter") commitEdit(todo.id, e.target.value.trim())
        if (e.key === "Escape") stopEditing()
      },
      blur: (e) => commitEdit(todo.id, e.target.value.trim())
    }
  })
}

function Item(todo, editing) {
  return h("li", {
    class: classes({ completed: todo.completed, editing }),
    "data-testid": "todo-item"
  }, [
    h("div", { class: "view" }, [
      h("input", {
        class: "toggle",
        type: "checkbox",
        "data-testid": "todo-item-toggle",
        checked: todo.completed,
        on: { change: () => toggleTodo(todo.id) }
      }),
      h("label", {
        "data-testid": "todo-item-label",
        on: { dblclick: () => startEditing(todo.id) }
      }, [todo.title]),
      h("button", {
        class: "destroy",
        "data-testid": "todo-item-button",
        "aria-label": "Delete todo",
        on: { click: () => removeTodo(todo.id) }
      })
    ]),
    editing && EditInput(todo)
  ])
}

function Main(state) {
  const visible = visibleTodos(state)

  return h("main", {
    class: "main",
    "data-testid": "main",
    hidden: state.todos.length === 0
  }, [
    h("div", { class: "toggle-all-container" }, [
      h("input", {
        class: "toggle-all",
        type: "checkbox",
        id: "toggle-all",
        "data-testid": "toggle-all",
        checked: visible.length > 0 && visible.every((t) => t.completed),
        on: { change: (e) => toggleAll(e.target.checked) }
      }),
      h("label", { class: "toggle-all-label", for: "toggle-all" }, ["Toggle All Input"])
    ]),
    h("ul", { class: "todo-list", "data-testid": "todo-list" },
      visible.map((todo) => Item(todo, state.editingId === todo.id)))
  ])
}

function Footer(state) {
  const total = state.todos.length
  const active = state.todos.filter((t) => !t.completed).length
  const completed = total - active

  const filter = (path, label) =>
    h("li", {}, [
      h("a", { class: state.route === path ? "selected" : null, href: "#" + path }, [label])
    ])

  return h("footer", { class: "footer", "data-testid": "footer", hidden: total === 0 }, [
    h("span", { class: "todo-count" },
      [active + " " + (active === 1 ? "item" : "items") + " left!"]),
    h("ul", { class: "filters", "data-testid": "footer-navigation" }, [
      filter("/", "All"),
      filter("/active", "Active"),
      filter("/completed", "Completed")
    ]),
    h("button", {
      class: "clear-completed",
      hidden: completed === 0,
      on: { click: clearCompleted }
    }, ["Clear completed"])
  ])
}

// The root view: three sibling vnodes, rendered straight into section.todoapp.
export function view(state) {
  return [Header(), Main(state), Footer(state)]
}