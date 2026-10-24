import { setHandlers } from "./events.js"

const isEmpty = (v) => v === null || v === undefined || v === false

// Describes an element as plain data. Creates nothing in the browser.
export function h(tag, attrs = {}, children = []) {
  return { tag, attrs, children }
}

// Turns a vnode (or a string) into a real DOM node. Recursive.
export function createElement(vnode) {
  if (typeof vnode === "string" || typeof vnode === "number") {
    return document.createTextNode(String(vnode))
  }

  const el = document.createElement(vnode.tag)

  for (const [key, value] of Object.entries(vnode.attrs)) {
    if (key === "on") {
      setHandlers(el, value)
    } else {
      setAttr(el, key, value)
    }
  }

  for (const child of vnode.children) {
    if (isEmpty(child)) continue
    el.appendChild(createElement(child))
  }

  // The element isn't on the page yet. A microtask runs after the current
  // render has attached it, so the focus call lands on a connected element.
  if (vnode.attrs.autofocus) queueMicrotask(() => focusElement(el))

  return el
}

function focusElement(el) {
  if (!el.isConnected) return
  el.focus()
  if (el.type === "text") el.setSelectionRange(el.value.length, el.value.length)
}

// value and checked are DOM properties; everything else is an attribute.
// Properties are only written when they differ, so the cursor doesn't jump.
export function setAttr(el, key, value) {
  if (key === "value") {
    const v = value ?? ""
    if (el.value !== v) el.value = v
    return
  }
  if (key === "checked") {
    const c = Boolean(value)
    if (el.checked !== c) el.checked = c
    return
  }
  if (isEmpty(value)) {
    el.removeAttribute(key)
    return
  }
  el.setAttribute(key, value === true ? "" : value)
}

// Renders a vnode (or an array of vnodes) into a container.
export function mount(vnode, container) {
  container.innerHTML = ""
  for (const v of [].concat(vnode)) {
    if (isEmpty(v)) continue
    container.appendChild(createElement(v))
  }
}