// element -> { click: fn, keydown: fn, ... }
const handlersByElement = new WeakMap()

// event types that already have a root listener
const listening = new Set()

// The single entry point for every event. Starts at the element the event
// happened on and walks up the tree, calling any handler registered for
// this event type along the way.
function dispatch(event) {
  let node = event.target
  while (node) {
    const fn = handlersByElement.get(node)?.[event.type]
    if (typeof fn === "function") fn(event)
    node = node.parentNode
  }
}

// Stores an element's handlers and makes sure a root listener exists
// for each event type used.
export function setHandlers(el, on = {}) {
  handlersByElement.set(el, on)

  for (const type of Object.keys(on)) {
    if (listening.has(type)) continue
    // capture = true so events that don't bubble (blur, focus) still arrive
    document.addEventListener(type, dispatch, true)
    listening.add(type)
  }
}