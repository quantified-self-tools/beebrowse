import * as KeyboardHelp from "./keyboard-help"

const events = {}

export function init() {
  KeyboardHelp.init()

  window.addEventListener("keydown", (event) => {
    if (event.isComposing) return
    const key = event.key
    const ctrl = event.ctrlKey
    const alt = event.altKey
    const meta = event.metaKey

    if (key === "Escape" && isEscapeHide(document.activeElement)) {
      trigger("escape-hide", document.activeElement)
      return
    }

    if (activeFocusedInput()) return

    if (!ctrl && !alt && !meta) {
      if (key === "f") {
        trigger("filter")
        event.preventDefault()
      } else if (key === "o") {
        trigger("uncollapse-all")
        event.preventDefault()
      }
    }
  })
}

export function on(name, callback) {
  if (!events[name]) events[name] = []
  events[name].push(callback)
}

export function trigger(name, payload = undefined) {
  const callbacks = events[name] || []
  callbacks.forEach((callback) => {
    callback(payload)
  })
}

function activeFocusedInput() {
  const elem = document.activeElement
  if (elem.isContentEditable) return true
  const active =
    ["INPUT", "TEXTAREA"].includes(elem.tagName) &&
    !["submit", "checkbox", "radio"].includes(elem.type) &&
    !elem.disabled

  if (!active) return false
  if (document.activeElement.classList.contains("stepper-value")) return false
  return true
}

function isEscapeHide(elem) {
  if (!elem) return
  return Boolean(elem.dataset.escapehide)
}
