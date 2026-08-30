import { describe, it, expect, beforeEach } from "vitest"
import {
  collapse,
  uncollapse,
  toggleCollapse,
  isCollapsed,
  getSort,
  setSort,
} from "../src/interface"

const DAY = 24 * 60 * 60

function setupDashboard() {
  const losedate = Math.floor(Date.now() / 1000) + DAY
  document.body.innerHTML = `
    <span class="sort-arrow" data-sort-string="slug"></span>
    <span class="sort-arrow" data-sort-string="pledge"></span>
    <div class="dashboard"><div class="panel"><div class="goals">
      <div class="goal" data-slug="g1" data-collapsed="0"
           data-losedate="${losedate}" data-baremin="3">
        <div class="summary"></div>
        <div class="descriptors"><span class="slug">g1</span></div>
      </div>
      <div class="goal" data-slug="g2" data-collapsed="1"
           data-losedate="${losedate}" data-baremin="3">
        <div class="summary"></div>
        <div class="descriptors"><span class="slug">g2</span></div>
      </div>
    </div></div></div>
  `
}

describe("interface.js - additional coverage", () => {
  beforeEach(() => {
    localStorage.clear()
    setupDashboard()
  })

  describe("collapse / uncollapse / toggleCollapse", () => {
    it("collapse() collapses an open goal", () => {
      expect(isCollapsed("g1")).toBe(false)
      collapse("g1")
      expect(isCollapsed("g1")).toBe(true)
    })

    it("uncollapse() opens a collapsed goal", () => {
      expect(isCollapsed("g2")).toBe(true)
      uncollapse("g2")
      expect(isCollapsed("g2")).toBe(false)
    })

    it("toggleCollapse() flips the current state", () => {
      expect(isCollapsed("g1")).toBe(false)
      toggleCollapse("g1")
      expect(isCollapsed("g1")).toBe(true)
      toggleCollapse("g1")
      expect(isCollapsed("g1")).toBe(false)
    })
  })

  describe("getSort / setSort", () => {
    it("getSort() returns the active sort string", () => {
      document
        .querySelector('[data-sort-string="pledge"]')
        .classList.add("octicon-triangle-down")
      expect(getSort()).toBe("pledge")
    })

    it('getSort() defaults to "simple"', () => {
      expect(getSort()).toBe("simple")
    })

    it("setSort() applies a valid sort value", () => {
      const events = []
      const handler = (e) => events.push(e.detail)
      document.addEventListener("beebrowse:sorted", handler)

      setSort("pledge")

      document.removeEventListener("beebrowse:sorted", handler)
      expect(events).toEqual([{ by: "pledge" }])
      expect(getSort()).toBe("pledge")
    })

    it("setSort() throws for an invalid sort value", () => {
      expect(() => setSort("nonsense")).toThrow(
        "Invalid value for sort: nonsense",
      )
    })
  })
})
