# mini-framework

A small JavaScript framework built from scratch, with no libraries. You describe your UI as plain objects, keep your data in one central store, and the framework takes care of updating the page. It includes:

- **DOM abstraction**: a virtual DOM (`h`, `mount`) with a diff/patch step that updates only what changed
- **State management**: one central store (`createStore`) that is reachable from anywhere
- **Routing**: hash routing (`#/active`) kept in sync with the state (`initRouter`, `navigate`)
- **Event handling**: a custom event system (`on: { click: fn }`) built on a single root dispatcher instead of per-element `addEventListener` calls

A TodoMVC app built entirely on this framework lives in `todo/`.

## Table of contents

1. [Running the project](#running-the-project)
2. [Project structure](#project-structure)
3. [The big idea](#the-big-idea)
4. [Creating an element](#creating-an-element)
5. [Adding attributes to an element](#adding-attributes-to-an-element)
6. [Nesting elements](#nesting-elements)
7. [Creating an event](#creating-an-event)
8. [State management](#state-management)
9. [Putting it together: `createApp`](#putting-it-together-createapp)
10. [Routing](#routing)
11. [Try it yourself](#try-it-yourself)
12. [How it works, and why](#how-it-works-and-why)
13. [Limitations](#limitations)
14. [API reference](#api-reference)

---

## Running the project

The framework uses ES modules (`import` / `export`). Browsers do not load modules from `file://`, so serve the folder with any static server. From the root of the project:

```bash
npx serve .
```

Then open the URL it prints (usually `http://localhost:3000`). The root `index.html` is the TodoMVC app.

## Project structure

```
index.html            entry point of the TodoMVC app
framework/            the framework itself
  index.js              public entry point: import everything from here
  dom.js                h, createElement, mount
  diff.js               compares old and new vnode trees and patches the DOM
  events.js             the event system
  store.js              createStore
  app.js                createApp (connects store + view)
  router.js             initRouter, navigate
todo/                 TodoMVC, built with the framework
  main.js               wires store, router and view together
  store.js              the app's state and the actions that change it
  view.js               the app's UI as functions that return vnodes
docs.md               this file
```

An app imports from `framework/index.js` only. The framework never imports anything from an app.

---

## The big idea

A normal library is something **you call**. A framework is something that **calls you**. Here that works like this:

```
state  ──►  view(state)  ──►  vnode tree  ──►  real DOM
  ▲                                               │
  └────────── event handler calls setState ◄──────┘
```

1. You write a **view function**: it takes the current state and returns a description of the UI.
2. You hand that function to the framework (`createApp`).
3. The framework calls it, and turns the description into real DOM.
4. When something happens (a click, a key press), your handler changes the state with `setState`.
5. The framework notices the change, calls your view function again, compares the new description with the old one, and updates only the parts of the page that differ.

You never touch the DOM yourself. You only describe what the page should look like for the current state.

---

## Creating an element

Elements are described with `h(tag, attrs, children)`. It returns a plain object called a **vnode** (virtual node). It does not create anything in the browser by itself.

```js
import { h, mount } from "./framework/index.js"

const vnode = h("p", {}, ["Hello from mini-framework"])

mount(vnode, document.getElementById("app"))
```

This puts `<p>Hello from mini-framework</p>` inside the element with id `app`.

What each part does:

- `h("p", {}, [...])` returns this object: `{ tag: "p", attrs: {}, children: ["Hello from mini-framework"] }`. That is the same `{ tag, attrs, children }` shape described in the project spec.
- `mount(vnode, container)` turns the vnode into real DOM nodes and puts them in `container`. It replaces whatever was inside the container.
- `attrs` and `children` are optional. `h("br")` is the same as `h("br", {}, [])`.

**Why it works this way:** a vnode is just data. It is cheap to create and easy to compare with another vnode. That comparison is what lets the framework update only what changed (see [How it works, and why](#how-it-works-and-why)).

---

## Adding attributes to an element

Attributes go in the second argument, as an object of names and values:

```js
h("input", {
  type: "text",
  placeholder: "Insert Name",
  class: "name-field",
  id: "name"
})
```

This renders `<input type="text" placeholder="Insert Name" class="name-field" id="name">`.

Rules:

| You write | The framework does |
|---|---|
| `class: "a b"` | sets the HTML attribute `class="a b"` (use `class`, not `className`) |
| `href`, `id`, `data-testid`, `aria-label`, `for`, ... | sets the attribute with that exact name |
| `disabled: true` | sets an empty attribute: `disabled=""` |
| `disabled: false`, or a value of `null` / `undefined` | the attribute is left out (or removed on a later update) |
| `value`, `checked` | set as **properties** of the element, not as attributes (see below) |
| `autofocus: true` | sets the attribute and also focuses the element once it is on the page |
| `on: { ... }` | not an attribute: it registers event handlers (see [Creating an event](#creating-an-event)) |

**Why `value` and `checked` are different:** for an `<input>`, the HTML attribute only sets the *initial* value. Once the user types or ticks a box, the live value lives in the element's property, and the attribute stops tracking it. So the framework writes `value` and `checked` as properties, and only when they differ from what is currently on screen. That keeps the text cursor from jumping while someone types.

**Conditional attributes** work naturally, because `false` and `null` mean "leave it out":

```js
h("button", { disabled: state.count >= 10, class: state.count > 5 ? "warning" : null }, ["Add"])
```

---

## Nesting elements

The third argument is an array of children. A child is either another `h(...)` call (an element) or a string or number (a text node). Nest as deep as you like.

This builds the example from the project spec, a `div` with class `nameSubm` that contains two inputs:

```js
import { h, mount } from "./framework/index.js"

const form = h("div", { class: "nameSubm" }, [
  h("input", { type: "text", placeholder: "Insert Name" }),
  h("input", { type: "submit", value: "Submit" })
])

mount(form, document.getElementById("app"))
```

`form` is this plain object:

```json
{
  "tag": "div",
  "attrs": { "class": "nameSubm" },
  "children": [
    { "tag": "input", "attrs": { "type": "text", "placeholder": "Insert Name" }, "children": [] },
    { "tag": "input", "attrs": { "type": "submit", "value": "Submit" }, "children": [] }
  ]
}
```

(The inputs get `"children": []` because `children` defaults to an empty array.)

**Mixing text and elements:**

```js
h("p", {}, ["You have ", h("strong", {}, [String(count)]), " items"])
```

**Lists** are built by mapping an array to vnodes:

```js
h("ul", {}, items.map(item => h("li", {}, [item])))
```

**Conditional children:** `null`, `undefined` and `false` are skipped, so you can write:

```js
h("div", {}, [
  h("h1", {}, ["Title"]),
  showFooter && h("footer", {}, ["Footer"])
])
```

**Why it works this way:** the framework builds the real DOM by calling itself on every child (recursion). A text child is the base case that stops it. That is why nesting works to any depth without extra code.

---

## Creating an event

Events are declared inside the attributes, under the special key `on`. Each key is an event name, and each value is a function:

```js
h("button", {
  on: {
    click: (event) => console.log("clicked", event.target)
  }
}, ["Click me"])
```

You can listen to several events on one element:

```js
h("input", {
  type: "text",
  on: {
    input:   (e) => console.log("typed:", e.target.value),
    keydown: (e) => { if (e.key === "Enter") console.log("enter") },
    blur:    ()  => console.log("left the field")
  }
})
```

Notes:

- The handler receives the normal browser event object, so `event.target`, `event.key` and so on all work.
- Any DOM event name can be used: `click`, `dblclick`, `keydown`, `keyup`, `input`, `change`, `blur`, `focus`, `scroll`, ... The framework needs no changes for new ones.
- You never call `addEventListener` yourself. The `on` object is the whole API.
- If a parent and a child both handle the same event type, a click on the child runs the child's handler first, then the parent's.
- Handlers usually call `setState` to change the state (see below). The page then updates by itself.

**Why it works this way:** the framework registers **one** listener per event type on the whole document, no matter how many elements use that event. When an event arrives, the framework's own dispatcher starts at `event.target` and walks up through the parents, calling any handler registered for that event type. This is different from the browser's `addEventListener`, which attaches a separate listener to every element. A list of 100 todo items needs one `click` listener, not 100. Handlers also survive re-renders, because the framework keeps them in its own registry and refreshes them each time the view runs.

---

## State management

The state is everything the app needs to remember: the todo items, which filter is selected, which item is being edited. It lives in one **store**.

```js
import { createStore } from "./framework/index.js"

const store = createStore({ count: 0, items: [] })

store.getState()                              // { count: 0, items: [] }
store.setState({ count: 1 })                  // merges into the state
store.setState(s => ({ count: s.count + 1 })) // or compute from the current state

const stop = store.subscribe(state => console.log("changed:", state))
stop() // unsubscribe
```

The three functions:

- `getState()` returns the current state object.
- `setState(update)` takes an object with the fields to change, or a function that receives the current state and returns such an object. The result is **merged** into the state: fields you leave out keep their old values.
- `subscribe(listener)` calls `listener(newState)` after every `setState`, and returns a function that cancels the subscription.

**Rules:**

- Never modify the state in place (`store.getState().items.push(...)`). Always give `setState` new objects and arrays, for example `items: [...s.items, newItem]`. The merge is shallow, so nested objects and arrays are replaced as a whole.
- The store is a plain object you can export from a module and import anywhere. Every file that imports it sees the same state, which is how several parts of an app share one state. `todo/store.js` does exactly this.

**Why it works this way:** one source of truth means the UI is always a function of the state (`view(state)`), so there is no way for two parts of the page to disagree. Subscribing is the observer pattern: the store does not know who is listening, it only notifies.

---

## Putting it together: `createApp`

`createApp` connects a store to a view function:

```js
import { h, createStore, createApp } from "./framework/index.js"

const store = createStore({ count: 0 })

function view(state) {
  return h("div", {}, [
    h("p", {}, ["Count: " + state.count]),
    h("button", {
      on: { click: () => store.setState(s => ({ count: s.count + 1 })) }
    }, ["Add one"])
  ])
}

createApp({ root: document.getElementById("app"), store, view })
```

What happens:

1. `createApp` calls `view(state)` once and renders the result into `root`.
2. It subscribes to the store.
3. After every `setState`, it calls `view(newState)` again and patches the page to match.

Your code never calls `view` and never updates the page. It only calls `setState`. This is the **inversion of control**: the framework calls you.

A view function may return one vnode, or an **array** of vnodes. An array is rendered as siblings directly inside `root`. TodoMVC uses this to render its header, main and footer side by side.

---

## Routing

Routing keeps the state and the URL in sync. The framework uses the hash part of the URL (`#/active`).

```js
import { createStore, createApp, initRouter, navigate } from "./framework/index.js"

const store = createStore({ route: "/" })   // the router reads and writes state.route
initRouter(store)
createApp({ root, store, view })
```

After `initRouter(store)`:

- The current hash is stored in `state.route`: no hash gives `"/"`, `#/active` gives `"/active"`, `#/completed` gives `"/completed"`.
- When the URL changes (a link click, the back and forward buttons, or typing in the address bar), `state.route` is updated and the view re-renders.
- When the state changes (`store.setState({ route: "/active" })`), the URL is updated.
- The page that was opened with a hash in the URL starts on that route.

Use the route like any other piece of state:

```js
function view(state) {
  const visible = state.route === "/active"
    ? state.items.filter(i => !i.done)
    : state.items

  return h("div", {}, [
    // Plain links work. The browser changes the hash and the router does the rest.
    h("a", { href: "#/" }, ["All"]),
    h("a", { href: "#/active", class: state.route === "/active" ? "selected" : null }, ["Active"]),

    // Or change the route from code:
    h("button", { on: { click: () => navigate("/completed") } }, ["Show completed"]),

    h("ul", {}, visible.map(i => h("li", {}, [i.text])))
  ])
}
```

**Why it works this way:** the route is stored as ordinary state, so the view reads it the same way it reads everything else, and there is no separate "router object" to consult while rendering. The two directions cannot loop forever, because each one only acts when the URL and `state.route` differ.

---

## Try it yourself

To test the framework with your own code, without touching the TodoMVC app, create two files in the project root.

`playground.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>playground</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./playground.js"></script>
</body>
</html>
```

`playground.js`:

```js
import { h, createStore, createApp } from "./framework/index.js"

const store = createStore({ count: 0 })

function view(state) {
  return h("div", { class: "counter" }, [
    h("p", {}, ["Count: " + state.count]),
    h("button", {
      on: { click: () => store.setState(s => ({ count: s.count + 1 })) }
    }, ["Add one"])
  ])
}

createApp({ root: document.getElementById("app"), store, view })
```

Run `npx serve .` and open `http://localhost:3000/playground.html`. Clicking the button raises the count. Open DevTools and watch the Elements panel: only the text of the paragraph changes. The rest of the tree is not touched.

---

## How it works, and why

### 1. The virtual DOM

`h` returns a **vnode**: `{ tag, attrs, children }`. A tree of vnodes is a cheap copy of what the page should look like. Because it is plain data, the framework can build a brand new tree on every state change and compare it with the previous one.

`createElement(vnode)` turns a vnode into a real DOM node. It creates the element, applies the attributes, and calls itself on every child. Strings and numbers become text nodes. `mount` uses it for the first render.

### 2. Diff and patch

Rebuilding the whole page on every change is simple but wasteful, and it has a visible problem: a text box you are typing in is destroyed and recreated, so it loses focus and text. Instead, after the first render the framework runs `patch(container, oldVnodes, newVnodes)`:

- **Same tag at the same position:** the real DOM node is kept. Its attributes are updated (removed ones are removed, changed ones are set), then its children are compared the same way. This is recursive, like `createElement`.
- **Different tag, or text turned into an element:** the old node is replaced by a freshly built one.
- **Text nodes:** only the text is updated, and only if it changed.
- **Extra new children** are appended, **extra old children** are removed.
- `value` and `checked` are compared against the live element, not against the old vnode, so what the user typed is never overwritten by stale data.

Children are matched by **position**. That is correct for all the apps here, but see [Limitations](#limitations).

### 3. The event system

When an element has an `on` object, the framework stores it in a `WeakMap` keyed by the real DOM node (a `WeakMap` lets the entry disappear automatically when the node is removed). For each event type it has not seen before, it registers one listener on `document`, in the capture phase so that events that do not bubble, like `blur`, still arrive. That listener is the **dispatcher**: it starts at `event.target`, walks up through `parentNode`, and calls the registered handler for that event type at each level.

The result is one listener per event type instead of one per element, handlers that are declared as data next to the element they belong to, and no `addEventListener` calls in application code.

### 4. The store

`createStore` is a closure: `state` and the list of listeners are private variables, and only `getState`, `setState` and `subscribe` can reach them. `setState` builds a **new** state object (`{ ...state, ...update }`) and then notifies every subscriber. Never mutating the old object is what makes it safe to compare "before" and "after".

### 5. `createApp`: the inversion of control

`createApp` subscribes a `render` function to the store. `render` calls your `view(state)`, then either `mount`s the result (first time) or `patch`es the page against the previous result. Your view function is only ever called by the framework.

### 6. The router

`initRouter` listens to the browser's `hashchange` event and copies the hash into `state.route`. It also subscribes to the store, and if `state.route` changes to something other than the current hash, it updates the hash. The URL and the state are two views of the same fact, and the router keeps them equal.

---

## Limitations

These are deliberate simplifications of a small framework:

- **No keys.** Children are matched by position. Removing an item from the middle of a list makes the later items update in place instead of removing one node. The page is correct, but a keyed diff would do less work.
- **Hash routing only.** There are no route patterns like `/todo/:id`.
- **Synchronous rendering.** Every `setState` renders immediately. Several `setState` calls in a row render several times.
- **No `stopPropagation`.** The dispatcher walks up the tree on its own, so calling `event.stopPropagation()` inside a handler does not stop parent handlers from running.
- **Shallow state merge.** `setState` replaces top-level fields. To change something nested, give `setState` a new copy of the whole field.
- **No components or lifecycle.** A "component" is just a function that returns a vnode (`todo/view.js` is built this way).
- Do not pass `true` as a child. Only strings, numbers and vnodes are rendered, and `null`, `undefined` and `false` are skipped.

---

## API reference

| Function | Description |
|---|---|
| `h(tag, attrs = {}, children = [])` | Returns a vnode `{ tag, attrs, children }`. `attrs.on` holds event handlers. |
| `createElement(vnode)` | Builds a real DOM node (and its children) from a vnode or a string. |
| `mount(vnode, container)` | Renders a vnode, or an array of vnodes, into `container`, replacing its contents. |
| `createStore(initialState)` | Returns `{ getState, setState, subscribe }`. |
| `store.getState()` | Returns the current state object. |
| `store.setState(update)` | Merges an object, or the object returned by `update(state)`, into the state and notifies subscribers. |
| `store.subscribe(listener)` | Calls `listener(state)` after every change. Returns an unsubscribe function. |
| `createApp({ root, store, view })` | Renders `view(state)` into `root` now and after every state change. `view` may return one vnode or an array. |
| `initRouter(store)` | Keeps `state.route` and `window.location.hash` in sync. |
| `navigate(path)` | Changes the URL hash, for example `navigate("/active")`. |

All of these are exported from `framework/index.js`.

---

## The TodoMVC app

`todo/` is a complete TodoMVC built only with the framework. Its markup, class names and attributes follow the official React TodoMVC example.

- `todo/store.js`: the state (`todos`, `route`, `editingId`) and the functions that change it (`addTodo`, `toggleTodo`, `removeTodo`, `commitEdit`, ...).
- `todo/view.js`: `Header`, `Main`, `Item`, `EditInput` and `Footer` are plain functions that return vnodes. `view(state)` returns all three top-level parts as an array.
- `todo/main.js`: calls `initRouter(store)` and `createApp(...)`. That is all the wiring.

Features: add, check and uncheck, remove, edit on double-click (Enter saves, Escape cancels, an empty title deletes the item), toggle all, the items-left counter, the All / Active / Completed filters (reflected in the URL), and Clear completed. The footer and the list are hidden while there are no todos.