const input = document.querySelector(".new-todo")
const list = document.querySelector(".todo-list")
const main = document.querySelector(".main")
const footer = document.querySelector(".footer")
const count = document.querySelector(".todo-count")

function updateUI() {
  const total = list.children.length
  const left = list.querySelectorAll("li:not(.completed)").length

  main.style.display = total === 0 ? "none" : ""
  footer.style.display = total === 0 ? "none" : ""
  count.innerHTML =
    "<strong>" + left + "</strong> " + (left === 1 ? "item" : "items") + " left"
}

function createTodo(text) {
  const li = document.createElement("li")

  const view = document.createElement("div")
  view.className = "view"

  const toggle = document.createElement("input")
  toggle.className = "toggle"
  toggle.type = "checkbox"
  toggle.addEventListener("change", function () {
    li.classList.toggle("completed", toggle.checked)
    updateUI()
  })

  const label = document.createElement("label")
  label.textContent = text

  const destroy = document.createElement("button")
  destroy.className = "destroy"
  destroy.addEventListener("click", function () {
    li.remove()
    updateUI()
  })

  view.append(toggle, label, destroy)

  const edit = document.createElement("input")
  edit.className = "edit"
  edit.value = text

  li.append(view, edit)
  return li
}

input.addEventListener("keydown", function (event) {
  if (event.key !== "Enter") return

  const text = input.value.trim()
  if (text === "") return

  list.appendChild(createTodo(text))
  input.value = ""
  updateUI()
})

updateUI()