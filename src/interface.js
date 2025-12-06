import { getSortBy, setSortBy, allowedSortValues } from "./sorting"
import { toggleCollapseGoal } from "./collapse"
import { isGoalCollapsed, getGoalBySlug, getGoalElements, clone } from "./util"

export { uncollapseAll } from "./collapse"

// Security:
// The object exported by this module is cloned into the page's global object.
// That is to say, normal website code can access it.
// That means we have to be careful that we're not exposing browser
// extension functionality that websites shouldn't get access to.

export function collapse(slug) {
  validateSlug(slug)
  const elem = goalElemBySlug(slug)
  if (isGoalCollapsed(elem)) return
  toggleCollapseGoal(elem)
}

export function uncollapse(slug) {
  validateSlug(slug)
  const elem = goalElemBySlug(slug)
  if (!isGoalCollapsed(elem)) return
  toggleCollapseGoal(elem)
}

export function toggleCollapse(slug) {
  validateSlug(slug)
  toggleCollapseGoal(goalElemBySlug(slug))
}

export function setCollapse(slug, value) {
  validateSlug(slug)

  const elem = goalElemBySlug(slug)
  if (Boolean(value) === isGoalCollapsed(elem)) return
  toggleCollapseGoal(elem)
}

export function isCollapsed(slug) {
  validateSlug(slug)
  return isGoalCollapsed(goalElemBySlug(slug))
}

export function getSort() {
  return getSortBy()
}

export function setSort(value) {
  validateSortValue(value)
  setSortBy(value)
}

export function listGoals() {
  return clone(getGoalElements().map((elem) => elem.dataset.slug))
}

export function listGoalsWithTag(tag) {
  validateTag(tag)
  return clone(
    getGoalElements()
      .filter((elem) => elem.dataset.tags.split(",").includes(tag))
      .map((elem) => elem.dataset.slug),
  )
}

function goalElemBySlug(slug) {
  const elem = getGoalBySlug(slug)
  if (elem) return elem
  throw new Error(`Goal with slug "${slug}" not found`)
}

function validateSlug(slug) {
  if (typeof slug !== "string") {
    throw new Error(`Invalid (non-string) slug: ${slug}`)
  } else if (slug === "") {
    throw new Error("Slug should not be empty")
  }
}

function validateSortValue(value) {
  if (!allowedSortValues.includes(value)) {
    throw new Error(`Invalid value for sort: ${value}`)
  }
}

function validateTag(tag) {
  if (typeof tag !== "string") {
    throw new Error(`Invalid (non-string) tag: ${tag}`)
  } else if (tag === "") {
    throw new Error("Tag should not be empty")
  }
}
