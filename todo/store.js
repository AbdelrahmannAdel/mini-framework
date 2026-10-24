import { createStore } from "../framework/index.js"

export const store = createStore({
  route: "/",
  todos: [],
  editingId: null
})

let nextId = 1

export function visibleTodos(state) {
  if (state.route === "/active") return state.todos.filter((t) => !t.completed)
  if (state.route === "/completed") return state.todos.filter((t) => t.completed)
  return state.todos
}

export function addTodo(title) {
  store.setState((s) => ({
    todos: [...s.todos, { id: nextId++, title, completed: false }]
  }))
}

export function toggleTodo(id) {
  store.setState((s) => ({
    todos: s.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
  }))
}

export function removeTodo(id) {
  store.setState((s) => ({ todos: s.todos.filter((t) => t.id !== id) }))
}

export function toggleAll(completed) {
  store.setState((s) => ({ todos: s.todos.map((t) => ({ ...t, completed })) }))
}

export function clearCompleted() {
  store.setState((s) => ({ todos: s.todos.filter((t) => !t.completed) }))
}

export function startEditing(id) {
  store.setState({ editingId: id })
}

export function stopEditing() {
  store.setState({ editingId: null })
}

// Enter and blur both call this. The guard makes sure only the first one
// counts, because the second arrives after editing has already ended.
export function commitEdit(id, title) {
  if (store.getState().editingId !== id) return

  if (title === "") {
    store.setState((s) => ({
      todos: s.todos.filter((t) => t.id !== id),
      editingId: null
    }))
  } else {
    store.setState((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, title } : t)),
      editingId: null
    }))
  }
}