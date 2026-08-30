import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { init, getSortBy, setSortBy, allowedSortValues } from "../src/sorting"

const DOWN = "octicon-triangle-down"

function buildArrows(values) {
  return values
    .map((v) => `<span class="sort-arrow" data-sort-string="${v}"></span>`)
    .join("")
}

function dashboard(extra = "") {
  document.body.innerHTML = `
    <div class="header">${extra}</div>
    <div class="dashboard"><div class="panel"><div class="goals"></div></div></div>
  `
}

describe("sorting.js", () => {
  describe("allowedSortValues", () => {
    it("lists exactly the supported sort modes", () => {
      expect(allowedSortValues).toEqual([
        "slug",
        "pledge",
        "lasttouch",
        "urgency",
        "simple",
      ])
    })
  })

  describe("getSortBy", () => {
    it('returns "simple" when there are no sort arrows', () => {
      document.body.innerHTML = ""
      expect(getSortBy()).toBe("simple")
    })

    it('returns "simple" when no arrow is in the descending state', () => {
      document.body.innerHTML = buildArrows(["slug", "pledge"])
      expect(getSortBy()).toBe("simple")
    })

    it("returns the sort-string of the descending arrow", () => {
      document.body.innerHTML = buildArrows(["slug", "pledge", "urgency"])
      document.querySelector('[data-sort-string="pledge"]').classList.add(DOWN)
      expect(getSortBy()).toBe("pledge")
    })
  })

  describe("setSortBy", () => {
    let sortedEvents
    let onSorted

    afterEach(() => {
      document.removeEventListener("beebrowse:sorted", onSorted)
    })

    beforeEach(() => {
      sortedEvents = []
      onSorted = (e) => sortedEvents.push(e.detail)
      document.addEventListener("beebrowse:sorted", onSorted)
      dashboard(buildArrows(["slug", "pledge", "urgency"]))
      // Start with "slug" active to prove it gets cleared.
      document.querySelector('[data-sort-string="slug"]').classList.add(DOWN)
    })

    it('dispatches a "sorted" event carrying the chosen value', () => {
      setSortBy("pledge")
      expect(sortedEvents).toEqual([{ by: "pledge" }])
    })

    it("marks only the chosen arrow as descending", () => {
      setSortBy("pledge")

      const isDown = (v) =>
        document
          .querySelector(`[data-sort-string="${v}"]`)
          .classList.contains(DOWN)

      expect(isDown("pledge")).toBe(true)
      expect(isDown("slug")).toBe(false)
      expect(isDown("urgency")).toBe(false)
    })
  })

  describe("init", () => {
    let sortedEvents
    let onSorted

    afterEach(() => {
      document.removeEventListener("beebrowse:sorted", onSorted)
    })

    beforeEach(() => {
      sortedEvents = []
      onSorted = (e) => sortedEvents.push(e.detail)
      document.addEventListener("beebrowse:sorted", onSorted)
    })

    function setup(extraButtons = "") {
      dashboard(`
        <a class="expand-collapse"></a>
        <span class="spacer"></span>
        ${buildArrows(["slug", "pledge", "urgency"])}
        ${extraButtons}
      `)
    }

    it("does nothing when there is no goals container", () => {
      document.body.innerHTML = `
        <a class="expand-collapse"></a><span class="spacer"></span>
      `
      init()
      expect(document.querySelector(".simple-sort-button")).toBeNull()
    })

    it("appends exactly one simple-sort button to the spacer", () => {
      setup('<a class="simple-sort-button">stale</a>')
      init()

      const buttons = document.querySelectorAll(".simple-sort-button")
      expect(buttons).toHaveLength(1)
      expect(buttons[0].parentElement.classList.contains("spacer")).toBe(true)
      // The button is an anchor pointing at "#" and carries the SVG icon.
      expect(buttons[0].getAttribute("href")).toBe("#")
      expect(buttons[0].querySelector("svg")).not.toBeNull()
    })

    it("wires existing sort buttons to setSortBy", () => {
      setup('<a class="sort-button" data-sort-string="pledge">P</a>')
      init()

      document.querySelector(".sort-button[data-sort-string]").click()

      expect(sortedEvents).toEqual([{ by: "pledge" }])
    })

    it('wires the injected simple-sort button to the "simple" sort', () => {
      setup()
      init()

      document.querySelector(".simple-sort-button").click()

      expect(sortedEvents).toEqual([{ by: "simple" }])
    })

    describe("with a ?sorting query param", () => {
      let originalHref
      beforeEach(() => {
        originalHref = window.location.href
        window.history.replaceState({}, "", "/?sorting=pledge")
      })
      afterEach(() => {
        window.history.replaceState({}, "", originalHref)
      })

      it("applies the requested sort and strips the param from the URL", () => {
        setup()
        init()

        expect(sortedEvents).toEqual([{ by: "pledge" }])
        expect(getSortBy()).toBe("pledge")
        expect(new URL(window.location.href).searchParams.has("sorting")).toBe(
          false,
        )
      })
    })

    describe("with a ?sorting param equal to the current sort", () => {
      let originalHref
      beforeEach(() => {
        originalHref = window.location.href
        // Default sort (no arrow active) is "simple".
        window.history.replaceState({}, "", "/?sorting=simple")
      })
      afterEach(() => {
        window.history.replaceState({}, "", originalHref)
      })

      it("does not re-apply the sort when it already matches", () => {
        setup()
        init()

        // No "sorted" event because sorting === getSortBy() already.
        expect(sortedEvents).toEqual([])
        expect(new URL(window.location.href).searchParams.has("sorting")).toBe(
          false,
        )
      })
    })
  })
})
