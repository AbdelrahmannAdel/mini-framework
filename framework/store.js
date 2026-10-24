// One central place for app state. Returns { getState, setState, subscribe }.
export function createStore(initialState = {}) {
  let state = initialState
  const listeners = new Set()

  function getState() {
    return state
  }

  // Accepts a partial object, or a function (currentState) => partial.
  // Always builds a NEW state object instead of mutating the old one.
  function setState(update) {
    const partial = typeof update === "function" ? update(state) : update
    state = { ...state, ...partial }
    for (const listener of listeners) listener(state)
  }

  // Registers a listener. Returns a function that removes it again.
  function subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  return { getState, setState, subscribe }
}