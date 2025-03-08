const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24

export function futureDays (date) {
  return Math.floor((date * 1000 - Date.now()) / MILLISECONDS_IN_DAY)
}

export function compare (a, b) {
  return a === b ? 0 : a > b ? 1 : -1
}

export function createElement (tag, text = null, props = {}) {
  const elem = document.createElement(tag)
  if (text) {
    elem.textContent = text
  }
  for (const [key, value] of Object.entries(props)) {
    elem[key] = value
  }
  return elem
}

export function createGoalLabel ({ baremin, losedate }) {
  const text = ` (${baremin}/${futureDays(+losedate)}d)`
  return createElement('span', text, {
    className: 'small-description'
  })
}

function compareGoalsBy (by, goalX, goalY, transform = String) {
  const isXCollapsed = isGoalCollapsed(goalX)
  const isYCollapsed = isGoalCollapsed(goalY)

  if (isXCollapsed === isYCollapsed) {
    const xVal = transform(goalX.dataset[by])
    const yVal = transform(goalY.dataset[by])
    return compare(xVal, yVal)
  } else {
    return isXCollapsed ? 1 : -1
  }
}

function simpleCmp (goalX, goalY) {
  const isXCollapsed = isGoalCollapsed(goalX)
  const isYCollapsed = isGoalCollapsed(goalY)

  if (isXCollapsed === isYCollapsed) {
    const xLosedate = futureDays(+goalX.dataset.losedate)
    const yLosedate = futureDays(+goalY.dataset.losedate)
    return compare(xLosedate, yLosedate)
  } else {
    return isXCollapsed ? 1 : -1
  }
}

function inverseNumber (value) {
  return -Number(value)
}

export function sortGoals (elems, sortBy) {
  let compare

  if (sortBy === 'slug') {
    compare = (a, b) => compareGoalsBy('slug', a, b)
  } else if (sortBy === 'pledge') {
    compare = (a, b) => compareGoalsBy('pledge', a, b, inverseNumber) || compareGoalsBy('losedate', a, b, Number) || compareGoalsBy('slug', a, b)
  } else if (sortBy === 'lasttouch') {
    compare = (a, b) => compareGoalsBy('lasttouch', a, b, inverseNumber) || compareGoalsBy('slug', a, b)
  } else if (sortBy === 'urgency') {
    compare = (a, b) => compareGoalsBy('urgencykey', a, b)
  } else if (sortBy === 'simple') {
    compare = (a, b) => simpleCmp(a, b) || compareGoalsBy('slug', a, b)
  } else {
    console.error(`Unknown sort string: ${sortBy}`)
    return sortGoals(elems, 'urgency')
  }

  elems.sort(compare)
}

export function getGoalElements () {
  return Array.from(
    document.querySelectorAll('.dashboard > .panel > .goals > .goal')
  )
}

export function getGoalParentElement () {
  return document.querySelector('.dashboard > .panel > .goals')
}

export function isGoalCollapsed (elem) {
  return Boolean(+elem.dataset.collapsed)
}
