import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  collapse,
  uncollapse,
  toggleCollapse,
  setCollapse,
  isCollapsed,
  listGoals,
  listGoalsWithTag,
} from "../src/interface"

describe("interface.js - public API", () => {
  beforeEach(() => {
    // Set up a minimal DOM structure
    document.body.innerHTML = `
      <div class="dashboard">
        <div class="panel">
          <div class="goals">
            <div class="goal" data-slug="goal-one" data-collapsed="0" data-tags="productivity,work">
              <div class="summary"></div>
            </div>
            <div class="goal" data-slug="goal-two" data-collapsed="1" data-tags="fitness">
              <div class="summary"></div>
            </div>
            <div class="goal" data-slug="goal-three" data-collapsed="0" data-tags="work,learning">
              <div class="summary"></div>
            </div>
          </div>
        </div>
      </div>
    `
  })

  describe("validation", () => {
    it("throws error for non-string slug", () => {
      expect(() => collapse(123)).toThrow("Invalid (non-string) slug")
      expect(() => collapse(null)).toThrow("Invalid (non-string) slug")
    })

    it("throws error for empty slug", () => {
      expect(() => collapse("")).toThrow("Slug should not be empty")
    })

    it("throws error for non-existent goal", () => {
      expect(() => collapse("nonexistent")).toThrow(
        'Goal with slug "nonexistent" not found',
      )
    })

    it("throws error for non-string tag", () => {
      expect(() => listGoalsWithTag(123)).toThrow("Invalid (non-string) tag")
    })

    it("throws error for empty tag", () => {
      expect(() => listGoalsWithTag("")).toThrow("Tag should not be empty")
    })
  })

  describe("isCollapsed", () => {
    it("returns false for uncollapsed goal", () => {
      expect(isCollapsed("goal-one")).toBe(false)
    })

    it("returns true for collapsed goal", () => {
      expect(isCollapsed("goal-two")).toBe(true)
    })
  })

  describe("listGoals", () => {
    it("returns array of all goal slugs", () => {
      const goals = listGoals()
      expect(goals).toEqual(["goal-one", "goal-two", "goal-three"])
    })

    it("returns a new array (not modifiable)", () => {
      const goals = listGoals()
      expect(Array.isArray(goals)).toBe(true)
      expect(goals.length).toBe(3)
    })
  })

  describe("listGoalsWithTag", () => {
    it("returns goals with specific tag", () => {
      const workGoals = listGoalsWithTag("work")
      expect(workGoals).toEqual(["goal-one", "goal-three"])
    })

    it("returns single goal when only one has tag", () => {
      const fitnessGoals = listGoalsWithTag("fitness")
      expect(fitnessGoals).toEqual(["goal-two"])
    })

    it("returns empty array when no goals have tag", () => {
      const hobbiesGoals = listGoalsWithTag("hobbies")
      expect(hobbiesGoals).toEqual([])
    })
  })

  describe("collapse/uncollapse operations", () => {
    it("collapse does nothing if already collapsed", () => {
      const elem = document.querySelector('[data-slug="goal-two"]')
      expect(elem.dataset.collapsed).toBe("1")

      collapse("goal-two")

      // Should still be collapsed
      expect(elem.dataset.collapsed).toBe("1")
    })

    it("uncollapse does nothing if already uncollapsed", () => {
      const elem = document.querySelector('[data-slug="goal-one"]')
      expect(elem.dataset.collapsed).toBe("0")

      uncollapse("goal-one")

      // Should still be uncollapsed
      expect(elem.dataset.collapsed).toBe("0")
    })

    it("setCollapse sets to specific value", () => {
      const elem = document.querySelector('[data-slug="goal-one"]')

      // Set to collapsed (true)
      setCollapse("goal-one", true)
      expect(elem.dataset.collapsed).toBe("1")

      // Set to uncollapsed (false)
      setCollapse("goal-one", false)
      expect(elem.dataset.collapsed).toBe("0")
    })

    it("setCollapse does nothing if already at target state", () => {
      const elem = document.querySelector('[data-slug="goal-two"]')
      expect(elem.dataset.collapsed).toBe("1")

      // Already collapsed, set to collapsed should be no-op
      setCollapse("goal-two", true)
      expect(elem.dataset.collapsed).toBe("1")
    })
  })
})
