import {
  createElement,
  getGoalElements,
  getGoalParentElement
} from './util'

export default {
  init () {
    if (!getGoalParentElement()) return

    this.undo()

    const filterBox = createElement('input', null, {
      placeholder: 'Filter',
      className: 'filter-box',
      tabIndex: 10000
    })

    const topNav = document.querySelector('.main-nav > .row > .links')
    topNav.prepend(filterBox)

    filterBox.classList.add('hidden')
    filterBox.dataset.escapehide = 'true'

    filterBox.addEventListener('input', onFilterChange)
    filterBox.addEventListener('blur', onFilterBlur)
  },
  undo () {
    document
      .querySelectorAll('input.filter-box')
      .forEach(elem => elem.remove())

    getGoalElements().forEach(elem => {
      elem.classList.remove('hidden')
    })
  },
  focusFilter () {
    const filterBox = document.querySelector('.filter-box')
    filterBox.classList.remove('hidden')
    filterBox.focus()
  }
}

function onFilterChange (event) {
  const target = event.target
  applyFilter(target)
}

function applyFilter (filterElem) {
  const value = filterElem.value.toLowerCase()
  getGoalElements().forEach(elem => applyFilterShowHide(elem, value))
}

function onFilterBlur (event) {
  const target = event.target
  applyFilter(target)
  if (!target.value) {
    target.classList.add('hidden')
  }
}

function getTitleText (elem) {
  const title = elem.querySelector('.title')
  return title ? [title.textContent.trim().toLowerCase()] : []
}

function automaticTags (elem) {
  const autotags = Array.from(elem.classList)
    .filter(x => !['goal', 'row', 'no-gutters'].includes(x))

  if (elem.dataset.coasting === 'true') autotags.push('coasting')
  if (elem.dataset.hhmmformat === 'true') autotags.push('time')
  return autotags
}

function filterFields (elem) {
  const titleText = getTitleText(elem)
  const slug = elem.dataset.slug
  const autotags = automaticTags(elem)
  const tags = splitTagsData(elem.dataset.tags)
  return [
    slug,
    ...titleText,
    ...autotags,
    ...tags
  ]
}

function applyFilterShowHide (elem, value) {
  if (!value) {
    elem.classList.remove('hidden')
    return
  }

  const anyMatch = filterFields(elem)
    .some(field => field.includes(value))

  if (anyMatch) {
    elem.classList.remove('hidden')
  } else {
    elem.classList.add('hidden')
  }
}

function splitTagsData (tags) {
  return tags ? tags.split(',') : []
}
