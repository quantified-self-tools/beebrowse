import LocalStorage from './localStorage'
import {
  createElement,
  createGoalLabel,
  getGoalElements,
  getGoalParentElement,
  isGoalCollapsed
} from './util'
import { renderGoalList } from './goals'
import { dispatch } from './events'

export default {
  init () {
    if (!getGoalParentElement()) return

    // If we've already added the collapse buttons,
    // we want to first remove the old buttons before
    // adding new ones.
    this.undo()

    const goalElements = getGoalElements()

    goalElements.forEach(elem => {
      addCollapseButton(elem)
      loadCollapsedState(elem)
      addCollapseListener(elem)
    })

    renderGoalList()
  },
  undo () {
    const parentElement = getGoalParentElement()
    removeCollapseButtons(parentElement)
    removeLabels(parentElement)
  },
  uncollapseAll () {
    getGoalElements()
      .filter(isGoalCollapsed)
      .forEach(toggleCollapseGoal)
  }
}

function addCollapseButton (elem) {
  const summary = elem.querySelector('.summary')
  if (summary) {
    summary.append(createElement('a', 'collapse', {
      href: '#',
      className: 'collapse-button'
    }))
  }
}

function addCollapseListener (elem) {
  elem.addEventListener('click', event => {
    try {
      if (Array.from(event.target.classList).includes('collapse-button') || isGoalCollapsed(elem)) {
        event.preventDefault()
        toggleCollapseGoal(elem)
      }
    } catch (err) {
      console.error(err)
    }
  })
}

export function toggleCollapseGoal (elem) {
  const collapsed = isGoalCollapsed(elem)

  if (!collapsed && isBeeminderExpanded(elem)) {
    elem.querySelector('.expanded-toggle').click()
  }

  elem.dataset.collapsed = collapsed ? 0 : 1
  LocalStorage.storeCollapsed(elem.dataset)

  renderGoalList()

  applyLabel(elem)

  if (collapsed) {
    dispatch('uncollapse', { slug: elem.dataset.slug })
  } else {
    dispatch('collapse', { slug: elem.dataset.slug })
  }
}

function isBeeminderExpanded (goal) {
  const expanded = localStorage['com.beeminder.dashboard.expandedList'] || ''
  const expandedList = expanded.split(',')
  return expandedList.includes(goal.dataset.slug)
}

function loadCollapsedState (elem) {
  const collapsed = LocalStorage.loadCollapsed(elem.dataset)

  elem.dataset.collapsed = collapsed

  applyLabel(elem)
}

function applyLabel (elem) {
  removeLabels(elem)

  if (isGoalCollapsed(elem)) {
    const slugElement = elem.querySelector('.descriptors .slug')
    if (slugElement) {
      slugElement.append(createGoalLabel(elem.dataset))
    }
  }
}

function removeCollapseButtons (elem) {
  elem
    .querySelectorAll('.collapse-button')
    .forEach(elem => elem.remove())
}

function removeLabels (elem) {
  elem
    .querySelectorAll('.small-description')
    .forEach(elem => elem.remove())
}
