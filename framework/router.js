// "#/active" -> "/active", "" or "#" -> "/"
function currentPath() {
  const path = window.location.hash.slice(1)
  return path === "" ? "/" : path
}

// Changes the URL. The hashchange listener then updates the state.
export function navigate(path) {
  window.location.hash = path
}

// Keeps store.route and the URL in sync in both directions.
export function initRouter(store) {
  // URL -> state (link clicks, back/forward buttons, typing in the address bar)
  function syncFromUrl() {
    const path = currentPath()
    if (store.getState().route !== path) store.setState({ route: path })
  }
  window.addEventListener("hashchange", syncFromUrl)

  // state -> URL (code that calls setState({ route: ... }))
  store.subscribe((state) => {
    if (state.route !== undefined && state.route !== currentPath()) {
      navigate(state.route)
    }
  })

  syncFromUrl() // pick up the URL the page was opened with
}