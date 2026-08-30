import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { init, undo, uncollapseAll, toggleCollapseGoal } from "../src/collapse"

const DAY = 24 * 60 * 60

function goalHtml({ slug, collapsed = "0", expandedToggle = false }) {
  const losedate = Math.floor(Date.now() / 1000) + DAY
  return `
    <div class="goal" data-slug="${slug}" data-collapsed="${collapsed}"
         data-losedate="${losedate}" data-baremin="3">
      <div class="summary"></div>
      ${expandedToggle ? '<a class="expanded-toggle"></a>' : ""}
      <div class="descriptors"><span class="slug">${slug}</span></div>
    </div>
  `
}

function setup(goals) {
  document.body.innerHTML = `
    <div class="dashboard"><div class="panel"><div class="goals">
      ${goals.map(goalHtml).join("")}
    </div></div></div>
  `
}

function goal(slug) {
  return document.querySelector(`.goal[data-slug="${slug}"]`)
}

function slugLabels(slug) {
  return goal(slug).querySelectorAll(".descriptors .slug .small-description")
}

describe("collapse.js", () => {
  let events
  let onCollapse
  let onUncollapse

  beforeEach(() => {
    localStorage.clear()
    events = []
    onCollapse = (e) => events.push(["collapse", e.detail])
    onUncollapse = (e) => events.push(["uncollapse", e.detail])
    document.addEventListener("beebrowse:collapse", onCollapse)
    document.addEventListener("beebrowse:uncollapse", onUncollapse)
  })

  afterEach(() => {
    document.removeEventListener("beebrowse:collapse", onCollapse)
    document.removeEventListener("beebrowse:uncollapse", onUncollapse)
    document.body.innerHTML = ""
  })

  describe("init", () => {
    it("does nothing without a goals container", () => {
      document.body.innerHTML = '<div class="other"></div>'
      expect(() => init()).not.toThrow()
    })

    it("adds exactly one collapse button to each goal summary", () => {
      setup([{ slug: "a" }, { slug: "b" }])
      init()

      expect(document.querySelectorAll(".collapse-button")).toHaveLength(2)
      expect(
        goal("a").querySelectorAll(".summary .collapse-button"),
      ).toHaveLength(1)

      const btn = goal("a").querySelector(".collapse-button")
      expect(btn.tagName).toBe("A")
      expect(btn.textContent).toBe("collapse")
      expect(btn.getAttribute("href")).toBe("#")
    })

    it("skips goals that have no summary element without erroring", () => {
      const losedate = Math.floor(Date.now() / 1000) + DAY
      document.body.innerHTML = `
        <div class="dashboard"><div class="panel"><div class="goals">
          <div class="goal" data-slug="x" data-collapsed="0"
               data-losedate="${losedate}" data-baremin="3">
            <div class="descriptors"><span class="slug">x</span></div>
          </div>
        </div></div></div>
      `
      expect(() => init()).not.toThrow()
      expect(document.querySelector(".collapse-button")).toBeNull()
    })

    it("is idempotent - re-running does not duplicate buttons", () => {
      setup([{ slug: "a" }])
      init()
      init()
      expect(document.querySelectorAll(".collapse-button")).toHaveLength(1)
    })

    it("restores collapsed state and label from localStorage", () => {
      localStorage["BeeBrowse/collapse/a"] = "1"
      setup([{ slug: "a" }, { slug: "b" }])
      init()

      expect(goal("a").dataset.collapsed).toBe("1")
      expect(slugLabels("a")).toHaveLength(1)
      // 'b' was not stored as collapsed -> no label.
      expect(goal("b").dataset.collapsed).toBe("0")
      expect(slugLabels("b")).toHaveLength(0)
    })
  })

  describe("toggleCollapseGoal", () => {
    beforeEach(() => {
      setup([{ slug: "a" }])
      init()
    })

    it("collapses an open goal: sets state, persists, labels, and dispatches", () => {
      toggleCollapseGoal(goal("a"))

      expect(goal("a").dataset.collapsed).toBe("1")
      expect(localStorage["BeeBrowse/collapse/a"]).toBe("1")
      expect(slugLabels("a")).toHaveLength(1)
      expect(events).toContainEqual(["collapse", { slug: "a" }])
    })

    it("uncollapses a collapsed goal back to the open state", () => {
      toggleCollapseGoal(goal("a")) // collapse
      events.length = 0

      toggleCollapseGoal(goal("a")) // uncollapse

      expect(goal("a").dataset.collapsed).toBe("0")
      expect(localStorage["BeeBrowse/collapse/a"]).toBe("0")
      expect(slugLabels("a")).toHaveLength(0)
      expect(events).toContainEqual(["uncollapse", { slug: "a" }])
    })
  })

  describe("uncollapseAll", () => {
    it("uncollapses every collapsed goal and leaves open ones alone", () => {
      localStorage["BeeBrowse/collapse/a"] = "1"
      localStorage["BeeBrowse/collapse/c"] = "1"
      setup([{ slug: "a" }, { slug: "b" }, { slug: "c" }])
      init()
      events.length = 0

      uncollapseAll()

      expect(goal("a").dataset.collapsed).toBe("0")
      expect(goal("b").dataset.collapsed).toBe("0")
      expect(goal("c").dataset.collapsed).toBe("0")
      expect(events).toContainEqual(["uncollapse", { slug: "a" }])
      expect(events).toContainEqual(["uncollapse", { slug: "c" }])
      // 'b' was already open, so it should not emit an uncollapse event.
      expect(events).not.toContainEqual(["uncollapse", { slug: "b" }])
    })
  })

  describe("click handling", () => {
    beforeEach(() => {
      setup([{ slug: "a" }])
      init()
    })

    it("collapses when the collapse button is clicked", () => {
      goal("a").querySelector(".collapse-button").click()
      expect(goal("a").dataset.collapsed).toBe("1")
    })

    it("uncollapses when a collapsed goal body is clicked", () => {
      toggleCollapseGoal(goal("a")) // collapse first
      expect(goal("a").dataset.collapsed).toBe("1")

      goal("a").click() // click anywhere on the collapsed goal
      expect(goal("a").dataset.collapsed).toBe("0")
    })

    it("does not toggle when an open goal body (not the button) is clicked", () => {
      // 'a' starts open; clicking a non-button child must leave it open.
      goal("a").querySelector(".descriptors").click()
      expect(goal("a").dataset.collapsed).toBe("0")
    })
  })

  describe("Beeminder expanded integration", () => {
    it("collapses the native expanded view when collapsing a tracked goal", () => {
      localStorage["com.beeminder.dashboard.expandedList"] = "a"
      setup([{ slug: "a", expandedToggle: true }])
      init()

      const toggle = goal("a").querySelector(".expanded-toggle")
      const clickSpy = vi.fn()
      toggle.addEventListener("click", clickSpy)

      toggleCollapseGoal(goal("a"))

      expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it("does not click the native toggle for an untracked goal", () => {
      localStorage["com.beeminder.dashboard.expandedList"] = "someone-else"
      setup([{ slug: "a", expandedToggle: true }])
      init()

      const toggle = goal("a").querySelector(".expanded-toggle")
      const clickSpy = vi.fn()
      toggle.addEventListener("click", clickSpy)

      toggleCollapseGoal(goal("a"))

      expect(clickSpy).not.toHaveBeenCalled()
    })

    it("matches the slug against a comma-separated expanded list", () => {
      localStorage["com.beeminder.dashboard.expandedList"] = "foo,bar"
      setup([{ slug: "foo", expandedToggle: true }])
      init()

      const toggle = goal("foo").querySelector(".expanded-toggle")
      const clickSpy = vi.fn()
      toggle.addEventListener("click", clickSpy)

      toggleCollapseGoal(goal("foo"))

      expect(clickSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe("undo", () => {
    it("removes collapse buttons and labels", () => {
      localStorage["BeeBrowse/collapse/a"] = "1"
      setup([{ slug: "a" }])
      init()
      expect(document.querySelector(".collapse-button")).not.toBeNull()
      expect(slugLabels("a")).toHaveLength(1)

      undo()

      expect(document.querySelector(".collapse-button")).toBeNull()
      expect(document.querySelector(".small-description")).toBeNull()
    })
  })
})
