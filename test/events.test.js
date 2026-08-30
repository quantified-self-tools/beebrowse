import { describe, it, expect, vi, afterEach } from "vitest"
import { dispatch } from "../src/events"

describe("events.js - dispatch", () => {
  const listeners = []

  function listen(name, handler) {
    document.addEventListener(name, handler)
    listeners.push([name, handler])
  }

  afterEach(() => {
    while (listeners.length) {
      const [name, handler] = listeners.pop()
      document.removeEventListener(name, handler)
    }
  })

  it('dispatches a CustomEvent namespaced with the "beebrowse:" prefix', () => {
    const correct = vi.fn()
    const bare = vi.fn()
    listen("beebrowse:thing", correct)
    listen("thing", bare)

    dispatch("thing")

    expect(correct).toHaveBeenCalledTimes(1)
    // The un-prefixed name must NOT fire (kills the empty-string-literal mutant).
    expect(bare).not.toHaveBeenCalled()
  })

  it("passes the detail payload through on the event", () => {
    let received
    listen("beebrowse:withdetail", (event) => {
      received = event.detail
    })

    dispatch("withdetail", { slug: "foo", count: 2 })

    expect(received).toEqual({ slug: "foo", count: 2 })
  })

  it("defaults the detail to null when not provided", () => {
    let received = "unset"
    listen("beebrowse:nodetail", (event) => {
      received = event.detail
    })

    dispatch("nodetail")

    expect(received).toBeNull()
  })
})
