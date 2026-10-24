import { setHandlers } from "./events.js"

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
    if (child === null || child === undefined || child === false) continue
    el.appendChild(createElement(child))
  }

  return el
}

// value and checked are DOM properties, everything else is an attribute.
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
  if (value === null || value === undefined || value === false) {
    el.removeAttribute(key)
    return
  }
  el.setAttribute(key, value === true ? "" : value)
}

// Renders a vnode into a container, replacing what was there.
export function mount(vnode, container) {
  container.innerHTML = ""
  container.appendChild(createElement(vnode))
}