import Sorting from './sorting'
import Collapse, { toggleCollapseGoal } from './collapse'
import { isGoalCollapsed, getGoalBySlug, getGoalElements, clone } from './util'

// Security:
// The object exported by this module is cloned into the page's global object.
// That is to say, normal website code can access it.
// That means we have to be careful that we're not exposing browser
// extension functionality that websites shouldn't get access to.

export default {
  collapse (slug) {
    validateSlug(slug)
    const elem = goalElemBySlug(slug)
    if (isGoalCollapsed(elem)) return
    toggleCollapseGoal(elem)
  },
  uncollapse (slug) {
    validateSlug(slug)
    const elem = goalElemBySlug(slug)
    if (!isGoalCollapsed(elem)) return
    toggleCollapseGoal(elem)
  },
  toggleCollapse (slug) {
    validateSlug(slug)
    toggleCollapseGoal(goalElemBySlug(slug))
  },
  setCollapse (slug, value) {
    validateSlug(slug)

    const elem = goalElemBySlug(slug)
    if (Boolean(value) === isGoalCollapsed(elem)) return
    toggleCollapseGoal(elem)
  },
  uncollapseAll () {
    Collapse.uncollapseAll()
  },
  isCollapsed (slug) {
    validateSlug(slug)
    return isGoalCollapsed(goalElemBySlug(slug))
  },
  getSort () {
    return Sorting.sortBy
  },
  setSort (value) {
    validateSortValue(value)
    Sorting.sortBy = value
  },
  listGoals () {
    return clone(getGoalElements().map((elem) => elem.dataset.slug))
  },
  listGoalsWithTag (tag) {
    validateTag(tag)
    return clone(getGoalElements()
      .filter((elem) => elem.dataset.tags.split(',').includes(tag))
      .map((elem) => elem.dataset.slug))
  }
}

function goalElemBySlug (slug) {
  const elem = getGoalBySlug(slug)
  if (elem) return elem
  throw new Error(`Goal with slug "${slug}" not found`)
}

function validateSlug (slug) {
  if (typeof slug !== 'string') {
    throw new Error(`Invalid (non-string) slug: ${slug}`)
  } else if (slug === '') {
    throw new Error('Slug should not be empty')
  }
}

function validateSortValue (value) {
  if (!Sorting.allowedSortValues.includes(value)) {
    throw new Error(`Invalid value for sort: ${value}`)
  }
}

function validateTag (tag) {
  if (typeof tag !== 'string') {
    throw new Error(`Invalid (non-string) tag: ${tag}`)
  } else if (tag === '') {
    throw new Error('Tag should not be empty')
  }
}
