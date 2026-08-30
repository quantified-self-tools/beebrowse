import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  futureDays,
  compare,
  createElement,
  createGoalLabel,
  sortGoals,
  clone,
  isGoalCollapsed,
  getGoalElements,
  getGoalBySlug,
  getGoalParentElement,
} from "../src/util"

const DAY = 24 * 60 * 60

describe("util.js - pure functions", () => {
  describe("compare", () => {
    it("returns 0 for equal values", () => {
      expect(compare(1, 1)).toBe(0)
      expect(compare("a", "a")).toBe(0)
    })

    it("returns 1 when first value is greater", () => {
      expect(compare(2, 1)).toBe(1)
      expect(compare("b", "a")).toBe(1)
    })

    it("returns -1 when first value is less", () => {
      expect(compare(1, 2)).toBe(-1)
      expect(compare("a", "b")).toBe(-1)
    })
  })

  describe("futureDays", () => {
    // Freeze the clock so day-boundary maths are exact (Date.now() is read
    // inside futureDays; without freezing, the few ms of drift floors 1 -> 0).
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(1_700_000_000_000)
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it("calculates days until a future date", () => {
      const nowSeconds = Date.now() / 1000
      const oneDayFuture = nowSeconds + 60 * 60 * 24
      expect(futureDays(oneDayFuture)).toBe(1)
    })

    it("returns 0 for today", () => {
      const nowSeconds = Date.now() / 1000
      expect(futureDays(nowSeconds)).toBe(0)
    })

    it("returns negative for past dates", () => {
      const nowSeconds = Date.now() / 1000
      const oneDayPast = nowSeconds - 60 * 60 * 24
      expect(futureDays(oneDayPast)).toBe(-1)
    })
  })
})

describe("util.js - DOM functions", () => {
  beforeEach(() => {
    // Reset document body before each test
    document.body.innerHTML = ""
  })

  describe("createElement", () => {
    it("creates an element with tag name", () => {
      const elem = createElement("div")
      expect(elem.tagName).toBe("DIV")
    })

    it("sets text content when provided", () => {
      const elem = createElement("span", "Hello")
      expect(elem.textContent).toBe("Hello")
    })

    it("applies properties from props object", () => {
      const elem = createElement("input", null, {
        className: "test-class",
        id: "test-id",
        placeholder: "Enter text",
      })
      expect(elem.className).toBe("test-class")
      expect(elem.id).toBe("test-id")
      expect(elem.placeholder).toBe("Enter text")
    })
  })

  describe("createGoalLabel", () => {
    it("creates a label with baremin and days until losedate", () => {
      const nowSeconds = Date.now() / 1000
      // 3.5 days out so Math.floor lands on 3 regardless of the few ms that
      // elapse before futureDays re-reads Date.now() (avoids boundary flake).
      const threeDaysFuture = nowSeconds + 60 * 60 * 24 * 3 + 60 * 60 * 12

      const label = createGoalLabel({
        baremin: "5",
        losedate: threeDaysFuture.toString(),
      })

      expect(label.tagName).toBe("SPAN")
      expect(label.className).toBe("small-description")
      expect(label.textContent).toBe(" (5/3d)")
    })
  })

  describe("sortGoals", () => {
    let goals

    beforeEach(() => {
      // Create mock goal elements with data attributes
      const createGoal = (
        slug,
        losedate,
        collapsed = "0",
        pledge = "0",
        lasttouch = "0",
        urgencykey = "0",
      ) => {
        const div = document.createElement("div")
        div.dataset.slug = slug
        div.dataset.losedate = losedate
        div.dataset.collapsed = collapsed
        div.dataset.pledge = pledge
        div.dataset.lasttouch = lasttouch
        div.dataset.urgencykey = urgencykey
        return div
      }

      const nowSeconds = Date.now() / 1000
      goals = [
        createGoal("goal-c", (nowSeconds + 3 * 24 * 60 * 60).toString()),
        createGoal("goal-a", (nowSeconds + 1 * 24 * 60 * 60).toString()),
        createGoal("goal-b", (nowSeconds + 2 * 24 * 60 * 60).toString()),
      ]
    })

    it("sorts by slug alphabetically", () => {
      sortGoals(goals, "slug")
      expect(goals.map((g) => g.dataset.slug)).toEqual([
        "goal-a",
        "goal-b",
        "goal-c",
      ])
    })

    it("sorts by simple (losedate urgency)", () => {
      sortGoals(goals, "simple")
      // Should be sorted by losedate (earliest first)
      expect(goals[0].dataset.slug).toBe("goal-a")
      expect(goals[1].dataset.slug).toBe("goal-b")
      expect(goals[2].dataset.slug).toBe("goal-c")
    })

    it("places collapsed goals after uncollapsed", () => {
      goals[0].dataset.collapsed = "1" // goal-c is collapsed

      sortGoals(goals, "slug")

      // goal-a and goal-b first (uncollapsed), then goal-c (collapsed)
      expect(goals[0].dataset.slug).toBe("goal-a")
      expect(goals[1].dataset.slug).toBe("goal-b")
      expect(goals[2].dataset.slug).toBe("goal-c")
    })

    it("falls back to urgency for unknown sort string", () => {
      // Should not throw, should use urgency sort
      sortGoals(goals, "invalid-sort")
      // Just verify it doesn't throw
      expect(goals).toHaveLength(3)
    })
  })
})

describe("util.js - sortGoals ranking detail", () => {
  const NOW = Date.now() / 1000

  function createGoal(props) {
    const div = document.createElement("div")
    div.dataset.slug = props.slug ?? "g"
    div.dataset.losedate = String(props.losedate ?? NOW)
    div.dataset.collapsed = props.collapsed ?? "0"
    div.dataset.pledge = String(props.pledge ?? 0)
    div.dataset.lasttouch = String(props.lasttouch ?? 0)
    div.dataset.urgencykey = props.urgencykey ?? ""
    return div
  }
  const slugsOf = (goals) => goals.map((g) => g.dataset.slug)

  it('breaks "simple" losedate ties by slug', () => {
    const goals = [
      createGoal({ slug: "b", losedate: NOW + DAY }),
      createGoal({ slug: "a", losedate: NOW + DAY }),
    ]
    sortGoals(goals, "simple")
    expect(slugsOf(goals)).toEqual(["a", "b"])
  })

  it('orders "pledge" by descending pledge amount', () => {
    const goals = [
      createGoal({ slug: "low", pledge: 1 }),
      createGoal({ slug: "high", pledge: 100 }),
      createGoal({ slug: "mid", pledge: 10 }),
    ]
    sortGoals(goals, "pledge")
    expect(slugsOf(goals)).toEqual(["high", "mid", "low"])
  })

  it('breaks "pledge" ties by losedate, then by slug', () => {
    const goals = [
      createGoal({ slug: "b", pledge: 5, losedate: NOW + 2 * DAY }),
      createGoal({ slug: "a", pledge: 5, losedate: NOW + 2 * DAY }),
      createGoal({ slug: "early", pledge: 5, losedate: NOW + 1 * DAY }),
    ]
    sortGoals(goals, "pledge")
    expect(slugsOf(goals)).toEqual(["early", "a", "b"])
  })

  it('orders "lasttouch" by descending recency, breaking ties by slug', () => {
    const goals = [
      createGoal({ slug: "old", lasttouch: 1 }),
      createGoal({ slug: "b", lasttouch: 50 }),
      createGoal({ slug: "a", lasttouch: 50 }),
    ]
    sortGoals(goals, "lasttouch")
    expect(slugsOf(goals)).toEqual(["a", "b", "old"])
  })

  it('orders "urgency" by urgencykey', () => {
    const goals = [
      createGoal({ slug: "c", urgencykey: "ccc" }),
      createGoal({ slug: "a", urgencykey: "aaa" }),
      createGoal({ slug: "b", urgencykey: "bbb" }),
    ]
    sortGoals(goals, "urgency")
    expect(slugsOf(goals)).toEqual(["a", "b", "c"])
  })

  it("keeps collapsed goals last even when they would otherwise rank first", () => {
    const goals = [
      createGoal({ slug: "collapsed-high", pledge: 100, collapsed: "1" }),
      createGoal({ slug: "open-low", pledge: 1, collapsed: "0" }),
    ]
    sortGoals(goals, "pledge")
    expect(slugsOf(goals)).toEqual(["open-low", "collapsed-high"])
  })
})

describe("util.js - clone", () => {
  afterEach(() => {
    delete globalThis.cloneInto
  })

  it("returns the object unchanged when cloneInto is unavailable", () => {
    const obj = { a: 1 }
    expect(clone(obj)).toBe(obj)
  })

  it("delegates to globalThis.cloneInto with the view and options when present", () => {
    const sentinel = { cloned: true }
    const spy = vi.fn(() => sentinel)
    globalThis.cloneInto = spy
    const obj = { a: 1 }
    const opts = { cloneFunctions: true }

    const result = clone(obj, opts)

    expect(result).toBe(sentinel)
    expect(spy).toHaveBeenCalledWith(obj, document.defaultView, opts)
  })
})

describe("util.js - DOM selectors", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="dashboard"><div class="panel"><div class="goals">
        <div class="goal" data-slug="x" data-collapsed="1"></div>
        <div class="goal" data-slug="y" data-collapsed="0"></div>
      </div></div></div>
    `
  })

  it("isGoalCollapsed reflects the data-collapsed attribute", () => {
    expect(isGoalCollapsed(getGoalBySlug("x"))).toBe(true)
    expect(isGoalCollapsed(getGoalBySlug("y"))).toBe(false)
  })

  it("getGoalElements returns every goal in order", () => {
    expect(getGoalElements().map((g) => g.dataset.slug)).toEqual(["x", "y"])
  })

  it("getGoalParentElement returns the goals container", () => {
    expect(getGoalParentElement().classList.contains("goals")).toBe(true)
  })

  it("getGoalBySlug returns null for an unknown slug", () => {
    expect(getGoalBySlug("nope")).toBeNull()
  })
})

describe("util.js - sortGoals edge cases", () => {
  const NOW = Date.now() / 1000

  function createGoal(props) {
    const div = document.createElement("div")
    div.dataset.slug = props.slug
    div.dataset.losedate = String(props.losedate ?? NOW)
    div.dataset.collapsed = props.collapsed ?? "0"
    div.dataset.pledge = String(props.pledge ?? 0)
    div.dataset.lasttouch = String(props.lasttouch ?? 0)
    div.dataset.urgencykey = props.urgencykey ?? ""
    return div
  }
  const slugsOf = (goals) => goals.map((g) => g.dataset.slug)

  // simpleCmp collapsed branch: a collapsed goal that is due sooner must still
  // sort AFTER an open goal. Both input orderings are exercised so that the
  // comparator is called with the collapsed element in each argument position.
  it("sorts a sooner-due collapsed goal last in simple sort [open, collapsed]", () => {
    const goals = [
      createGoal({ slug: "open", losedate: NOW + 3 * DAY, collapsed: "0" }),
      createGoal({ slug: "coll", losedate: NOW + 1 * DAY, collapsed: "1" }),
    ]
    sortGoals(goals, "simple")
    expect(slugsOf(goals)).toEqual(["open", "coll"])
  })

  it("sorts a sooner-due collapsed goal last in simple sort [collapsed, open]", () => {
    const goals = [
      createGoal({ slug: "coll", losedate: NOW + 1 * DAY, collapsed: "1" }),
      createGoal({ slug: "open", losedate: NOW + 3 * DAY, collapsed: "0" }),
    ]
    sortGoals(goals, "simple")
    expect(slugsOf(goals)).toEqual(["open", "coll"])
  })

  // Pledge tie -> losedate tiebreak. Input is already in correct (ascending
  // losedate) order so a broken tiebreak that always returns -1 would wrongly
  // reverse it.
  it("uses losedate as the pledge tiebreaker (pre-sorted stays put)", () => {
    // Input is ALREADY in correct (ascending losedate) order. A broken
    // tiebreak that always returns -1 would wrongly reverse it.
    const goals = [
      createGoal({ slug: "early", pledge: 5, losedate: NOW + 1 * DAY }),
      createGoal({ slug: "late", pledge: 5, losedate: NOW + 3 * DAY }),
    ]
    sortGoals(goals, "pledge")
    expect(slugsOf(goals)).toEqual(["early", "late"])
  })

  // Lasttouch sort: descending recency. Input is ALREADY descending so a broken
  // primary key (always -1) would wrongly reverse it.
  it("orders lasttouch strictly descending", () => {
    const goals = [
      createGoal({ slug: "high", lasttouch: 100 }),
      createGoal({ slug: "low", lasttouch: 1 }),
    ]
    sortGoals(goals, "lasttouch")
    expect(slugsOf(goals)).toEqual(["high", "low"])
  })

  // Unknown sort string must recurse into URGENCY ordering (not simple, not a
  // no-op). Urgency order differs from both the input order and losedate order.
  it("falls back to urgency ordering for an unknown sort string", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const goals = [
      createGoal({ slug: "u3", urgencykey: "c", losedate: NOW + 2 * DAY }),
      createGoal({ slug: "u1", urgencykey: "a", losedate: NOW + 3 * DAY }),
      createGoal({ slug: "u2", urgencykey: "b", losedate: NOW + 1 * DAY }),
    ]
    sortGoals(goals, "invalid-xyz")
    expect(spy).toHaveBeenCalledWith("Unknown sort string: invalid-xyz")
    expect(slugsOf(goals)).toEqual(["u1", "u2", "u3"])
    spy.mockRestore()
  })
})
