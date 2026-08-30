import { describe, it, expect, beforeEach } from "vitest"
import { init, undo, focusFilter } from "../src/filter"

// Builds a goal element matching the structure filter.js inspects.
function buildGoal({
  slug,
  title = null,
  tags = null,
  classes = [],
  coasting = false,
  hhmm = false,
  todayta = "none", // 'none' | 'visible' | 'hidden'
}) {
  const goal = document.createElement("div")
  goal.className = ["goal", "row", "no-gutters", ...classes].join(" ")
  goal.dataset.slug = slug
  if (tags !== null) goal.dataset.tags = tags
  if (coasting) goal.dataset.coasting = "true"
  if (hhmm) goal.dataset.hhmmformat = "true"

  if (title !== null) {
    const titleEl = document.createElement("div")
    titleEl.className = "title"
    titleEl.textContent = title
    goal.appendChild(titleEl)
  }

  if (todayta !== "none") {
    const td = document.createElement("div")
    td.className = "todayta"
    if (todayta === "hidden") td.classList.add("hidden")
    goal.appendChild(td)
  }

  return goal
}

function setupDashboard(goals) {
  document.body.innerHTML = `
    <div class="main-nav"><div class="row"><div class="links"></div></div></div>
    <div class="dashboard"><div class="panel"><div class="goals"></div></div></div>
  `
  const parent = document.querySelector(".goals")
  goals.forEach((g) => parent.appendChild(buildGoal(g)))
}

function typeFilter(value) {
  const box = document.querySelector(".filter-box")
  box.value = value
  box.dispatchEvent(new Event("input"))
}

function hidden(slug) {
  return document
    .querySelector(`.goal[data-slug="${slug}"]`)
    .classList.contains("hidden")
}

describe("filter.js", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  describe("init", () => {
    it("does nothing when there is no goals container", () => {
      document.body.innerHTML = `
        <div class="main-nav"><div class="row"><div class="links"></div></div></div>
      `
      init()
      expect(document.querySelector(".filter-box")).toBeNull()
    })

    it("prepends a configured, hidden filter box to the top nav", () => {
      setupDashboard([{ slug: "a" }])
      init()

      const links = document.querySelector(".main-nav > .row > .links")
      const box = links.firstElementChild

      expect(box).not.toBeNull()
      expect(box.tagName).toBe("INPUT")
      expect(box.classList.contains("filter-box")).toBe(true)
      expect(box.placeholder).toBe("Filter")
      expect(box.tabIndex).toBe(10000)
      expect(box.classList.contains("hidden")).toBe(true)
      expect(box.dataset.escapehide).toBe("true")
    })

    it("removes any pre-existing filter box before adding a new one", () => {
      setupDashboard([{ slug: "a" }])
      init()
      init()
      expect(document.querySelectorAll(".filter-box")).toHaveLength(1)
    })
  })

  describe("focusFilter", () => {
    it("unhides and focuses the filter box", () => {
      setupDashboard([{ slug: "a" }])
      init()

      focusFilter()

      const box = document.querySelector(".filter-box")
      expect(box.classList.contains("hidden")).toBe(false)
      expect(document.activeElement).toBe(box)
    })
  })

  describe("filtering behaviour", () => {
    beforeEach(() => {
      setupDashboard([
        { slug: "run-daily", title: "Go running", tags: "health,outdoor" },
        { slug: "read-books", title: "Read more", tags: "learning" },
        { slug: "write-code", title: "Ship features", tags: "work" },
      ])
      init()
    })

    it("hides goals that do not match and keeps those that do", () => {
      typeFilter("run")
      expect(hidden("run-daily")).toBe(false)
      expect(hidden("read-books")).toBe(true)
      expect(hidden("write-code")).toBe(true)
    })

    it("matches against the goal title text", () => {
      typeFilter("ship")
      expect(hidden("write-code")).toBe(false)
      expect(hidden("run-daily")).toBe(true)
    })

    it('matches tags using the "#" prefix', () => {
      typeFilter("#learning")
      expect(hidden("read-books")).toBe(false)
      expect(hidden("run-daily")).toBe(true)
      expect(hidden("write-code")).toBe(true)
    })

    it("requires every whitespace-separated term to match (AND semantics)", () => {
      // "run" matches run-daily, but "learning" does not -> nothing shown.
      typeFilter("run learning")
      expect(hidden("run-daily")).toBe(true)
      expect(hidden("read-books")).toBe(true)

      // Both terms present on read-books (slug + tag).
      typeFilter("read #learning")
      expect(hidden("read-books")).toBe(false)
      expect(hidden("run-daily")).toBe(true)
    })

    it("shows everything again when the filter is cleared", () => {
      typeFilter("run")
      expect(hidden("read-books")).toBe(true)

      typeFilter("")
      expect(hidden("run-daily")).toBe(false)
      expect(hidden("read-books")).toBe(false)
      expect(hidden("write-code")).toBe(false)
    })

    it("ignores extra whitespace between terms", () => {
      typeFilter("  run   ")
      expect(hidden("run-daily")).toBe(false)
      expect(hidden("read-books")).toBe(true)
    })
  })

  describe("automatic tags", () => {
    it("derives #coasting, #time, #done and #open auto-tags", () => {
      setupDashboard([
        { slug: "g-coast", coasting: true, todayta: "hidden" },
        { slug: "g-time", hhmm: true, todayta: "hidden" },
        { slug: "g-done", todayta: "visible" },
        { slug: "g-open", todayta: "hidden" },
      ])
      init()

      typeFilter("#coasting")
      expect(hidden("g-coast")).toBe(false)
      expect(hidden("g-time")).toBe(true)

      typeFilter("#time")
      expect(hidden("g-time")).toBe(false)
      expect(hidden("g-coast")).toBe(true)

      typeFilter("#done")
      expect(hidden("g-done")).toBe(false)
      expect(hidden("g-open")).toBe(true)

      typeFilter("#open")
      expect(hidden("g-open")).toBe(false)
      expect(hidden("g-coast")).toBe(false) // coasting goal has hidden todayta -> also #open
      expect(hidden("g-done")).toBe(true)
    })

    it("exposes CSS classes (besides layout classes) as auto-tags", () => {
      setupDashboard([
        { slug: "tagged", classes: ["frontburner"], todayta: "hidden" },
        { slug: "plain", todayta: "hidden" },
      ])
      init()

      typeFilter("#frontburner")
      expect(hidden("tagged")).toBe(false)
      expect(hidden("plain")).toBe(true)

      // Layout classes must NOT be matchable as tags.
      typeFilter("#no-gutters")
      expect(hidden("tagged")).toBe(true)
      expect(hidden("plain")).toBe(true)
    })
  })

  describe("blur behaviour", () => {
    it("re-hides the box on blur when it is empty", () => {
      setupDashboard([{ slug: "a" }])
      init()
      const box = document.querySelector(".filter-box")

      focusFilter()
      expect(box.classList.contains("hidden")).toBe(false)

      box.value = ""
      box.dispatchEvent(new Event("blur"))
      expect(box.classList.contains("hidden")).toBe(true)
    })

    it("keeps the box visible on blur when it has a value", () => {
      setupDashboard([{ slug: "a" }])
      init()
      const box = document.querySelector(".filter-box")

      focusFilter()
      box.value = "a"
      box.dispatchEvent(new Event("blur"))
      expect(box.classList.contains("hidden")).toBe(false)
    })
  })

  describe("attribute construction guards", () => {
    it("does not match layout classes (#goal, #row) as auto-tags", () => {
      setupDashboard([
        { slug: "a", title: "Apple", tags: "fruit" },
        { slug: "b", title: "Banana", tags: "fruit" },
      ])
      init()

      typeFilter("#goal")
      expect(hidden("a")).toBe(true)
      expect(hidden("b")).toBe(true)

      typeFilter("#row")
      expect(hidden("a")).toBe(true)
      expect(hidden("b")).toBe(true)
    })

    it("invents no attributes for a goal lacking both a title and tags", () => {
      // "was" is a lowercase substring of Stryker's array placeholder
      // ("...was here"); a stray injected entry would make this goal match.
      setupDashboard([{ slug: "plain", todayta: "hidden" }])
      init()

      typeFilter("was")
      expect(hidden("plain")).toBe(true)
    })
  })

  describe("undo", () => {
    it("removes filter boxes and unhides all goals", () => {
      setupDashboard([
        { slug: "a", title: "Apple" },
        { slug: "b", title: "Banana" },
      ])
      init()
      typeFilter("apple")
      expect(hidden("b")).toBe(true)

      undo()

      expect(document.querySelector(".filter-box")).toBeNull()
      expect(hidden("a")).toBe(false)
      expect(hidden("b")).toBe(false)
    })
  })
})
