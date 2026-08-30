import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { init, on, trigger } from "../src/hotkeys"

function keydown(opts) {
  const event = new KeyboardEvent("keydown", { cancelable: true, ...opts })
  window.dispatchEvent(event)
  return event
}

describe("hotkeys.js - event registry", () => {
  it("invokes all callbacks registered for a name with the payload", () => {
    const a = vi.fn()
    const b = vi.fn()
    on("reg-multi", a)
    on("reg-multi", b)

    trigger("reg-multi", 42)

    expect(a).toHaveBeenCalledWith(42)
    expect(b).toHaveBeenCalledWith(42)
  })

  it("does nothing (no throw) when triggering an unknown name", () => {
    expect(() => trigger("reg-never-registered")).not.toThrow()
  })

  it("passes undefined as the payload by default", () => {
    const cb = vi.fn()
    on("reg-default", cb)
    trigger("reg-default")
    expect(cb).toHaveBeenCalledWith(undefined)
  })
})

describe("hotkeys.js - keydown handling", () => {
  // init() attaches an anonymous window keydown listener. Register a FRESH one
  // per test and remove it afterwards. Doing this in beforeEach (not beforeAll)
  // matters under Stryker: it re-binds the listener for every test run so the
  // currently-active mutated handler is the one that fires, and the cleanup
  // prevents stale listeners leaking onto the shared jsdom window.
  let keydownListener

  beforeEach(() => {
    document.body.innerHTML = ""
    const realAdd = window.addEventListener.bind(window)
    window.addEventListener = (type, fn, opts) => {
      if (type === "keydown") keydownListener = fn
      return realAdd(type, fn, opts)
    }
    init()
    window.addEventListener = realAdd
  })

  afterEach(() => {
    if (keydownListener) {
      window.removeEventListener("keydown", keydownListener)
      keydownListener = null
    }
  })

  it('triggers "filter" and prevents default on plain "f"', () => {
    const spy = vi.fn()
    on("filter", spy)

    const event = keydown({ key: "f" })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it('triggers "uncollapse-all" and prevents default on plain "o"', () => {
    const spy = vi.fn()
    on("uncollapse-all", spy)

    const event = keydown({ key: "o" })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)
  })

  it("does not trigger any hotkey on an unmapped key", () => {
    const filterSpy = vi.fn()
    const uncollapseSpy = vi.fn()
    on("filter", filterSpy)
    on("uncollapse-all", uncollapseSpy)

    keydown({ key: "z" })

    expect(filterSpy).not.toHaveBeenCalled()
    expect(uncollapseSpy).not.toHaveBeenCalled()
  })

  it("does not enter the escape-hide path for a non-Escape key", () => {
    const escSpy = vi.fn()
    const filterSpy = vi.fn()
    on("escape-hide", escSpy)
    on("filter", filterSpy)

    keydown({ key: "f" })

    expect(escSpy).not.toHaveBeenCalled()
    expect(filterSpy).toHaveBeenCalledTimes(1)
  })

  it('ignores "f" while a modifier is held', () => {
    for (const mod of ["ctrlKey", "altKey", "metaKey"]) {
      const spy = vi.fn()
      on("filter", spy)
      keydown({ key: "f", [mod]: true })
      expect(
        spy,
        `modifier ${mod} should suppress the hotkey`,
      ).not.toHaveBeenCalled()
    }
  })

  it("ignores keys while composing (IME)", () => {
    const spy = vi.fn()
    on("filter", spy)
    keydown({ key: "f", isComposing: true })
    expect(spy).not.toHaveBeenCalled()
  })

  describe("Escape / escape-hide", () => {
    it('triggers "escape-hide" with the active element when it opts in', () => {
      document.body.innerHTML = '<input id="eh" data-escapehide="true">'
      const input = document.getElementById("eh")
      input.focus()

      const spy = vi.fn()
      on("escape-hide", spy)

      keydown({ key: "Escape" })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(input)
    })

    it('does not trigger "escape-hide" for elements without the opt-in', () => {
      document.body.innerHTML = '<input id="plain">'
      document.getElementById("plain").focus()

      const spy = vi.fn()
      on("escape-hide", spy)

      keydown({ key: "Escape" })

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe("focused input suppression", () => {
    it("suppresses hotkeys while a text input is focused", () => {
      document.body.innerHTML = '<input id="text" type="text">'
      document.getElementById("text").focus()

      const spy = vi.fn()
      on("filter", spy)
      keydown({ key: "f" })

      expect(spy).not.toHaveBeenCalled()
    })

    it("suppresses hotkeys while a textarea is focused", () => {
      document.body.innerHTML = '<textarea id="ta"></textarea>'
      document.getElementById("ta").focus()

      const spy = vi.fn()
      on("filter", spy)
      keydown({ key: "f" })

      expect(spy).not.toHaveBeenCalled()
    })

    it("suppresses hotkeys while a contenteditable element is focused", () => {
      document.body.innerHTML = '<div id="ce" tabindex="0"></div>'
      const ce = document.getElementById("ce")
      // jsdom does not derive isContentEditable, so set it explicitly.
      Object.defineProperty(ce, "isContentEditable", {
        value: true,
        configurable: true,
      })
      ce.focus()
      expect(document.activeElement).toBe(ce)

      const spy = vi.fn()
      on("filter", spy)
      keydown({ key: "f" })

      expect(spy).not.toHaveBeenCalled()
    })

    it("still fires hotkeys when the focused input is a submit button", () => {
      document.body.innerHTML = '<input id="submit" type="submit">'
      document.getElementById("submit").focus()

      const spy = vi.fn()
      on("uncollapse-all", spy)
      keydown({ key: "o" })

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it("still fires hotkeys when the focused input is a radio button", () => {
      document.body.innerHTML = '<input id="radio" type="radio">'
      document.getElementById("radio").focus()

      const spy = vi.fn()
      on("uncollapse-all", spy)
      keydown({ key: "o" })

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it("still fires hotkeys when the focused control is a checkbox", () => {
      document.body.innerHTML = '<input id="cb" type="checkbox">'
      document.getElementById("cb").focus()

      const spy = vi.fn()
      on("uncollapse-all", spy)
      keydown({ key: "o" })

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it("still fires hotkeys when the focused input is a stepper-value", () => {
      document.body.innerHTML =
        '<input id="step" type="text" class="stepper-value">'
      document.getElementById("step").focus()

      const spy = vi.fn()
      on("filter", spy)
      keydown({ key: "f" })

      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})
