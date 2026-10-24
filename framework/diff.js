import { createElement, setAttr } from "./dom.js"
import { setHandlers } from "./events.js"

const isText = (v) => typeof v === "string" || typeof v === "number"
const isEmpty = (v) => v === null || v === undefined || v === false

// createElement skips empty children, so the diff must skip them too,
// otherwise vnode positions and DOM positions drift apart.
const clean = (children) => children.filter((c) => !isEmpty(c))

// Compares two vnodes and updates the real DOM node `el` to match.
// Returns the node that should be on the page (a new one if it had to be replaced).
function patchNode(el, oldV, newV) {
  if (isText(oldV) || isText(newV)) {
    if (isText(oldV) && isText(newV)) {
      if (String(oldV) !== String(newV)) el.nodeValue = String(newV)
      return el
    }
    return createElement(newV) // text <-> element: replace
  }

  if (oldV.tag !== newV.tag) return createElement(newV) // different tag: replace

  patchAttrs(el, oldV.attrs, newV.attrs)
  patchChildren(el, oldV.children, newV.children)
  return el
}

function patchAttrs(el, oldAttrs, newAttrs) {
  for (const key of Object.keys(oldAttrs)) {
    if (!(key in newAttrs)) removeAttr(el, key)
  }
  for (const [key, value] of Object.entries(newAttrs)) {
    if (key === "on") {
      setHandlers(el, value) // new closures every render, so always refresh
    } else if (value !== oldAttrs[key] || key === "value" || key === "checked") {
      setAttr(el, key, value)
    }
  }
}

function removeAttr(el, key) {
  if (key === "on") setHandlers(el, {})
  else if (key === "value") el.value = ""
  else if (key === "checked") el.checked = false
  else el.removeAttribute(key)
}

function patchChildren(el, oldKids, newKids) {
  const oldC = clean(oldKids)
  const newC = clean(newKids)
  const common = Math.min(oldC.length, newC.length)

  // 1. children that exist in both trees: patch in place (recursive)
  for (let i = 0; i < common; i++) {
    const child = el.childNodes[i]
    const next = patchNode(child, oldC[i], newC[i])
    if (next !== child) el.replaceChild(next, child)
  }

  // 2. new tree has more children: add them
  for (let i = common; i < newC.length; i++) {
    el.appendChild(createElement(newC[i]))
  }

  // 3. old tree had more children: remove the extras
  for (let i = common; i < oldC.length; i++) {
    el.removeChild(el.lastChild)
  }
}

// Updates the DOM inside `container` from the old vnode(s) to the new one(s).
export function patch(container, oldVnode, newVnode) {
  patchChildren(container, [].concat(oldVnode), [].concat(newVnode))
}