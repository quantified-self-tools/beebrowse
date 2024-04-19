const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24

export function futureDays (date) {
  return Math.floor((date * 1000 - Date.now()) / MILLISECONDS_IN_DAY)
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
  const text = ` (${baremin}/${futureDays(losedate)}d)`
  return createElement('span', text, {
    className: 'small-description'
  })
}

export function goalCmp ({ dataset: x }, { dataset: y }) {
  if (+x.collapsed === +y.collapsed) {
    return x.urgencykey === y.urgencykey ? 0 : x.urgencykey > y.urgencykey ? 1 : -1
  } else {
    if (+x.collapsed) return 1
    else return -1
  }
}

export function getGoalElements () {
  return Array.from(document.querySelectorAll('.dashboard > .panel > .goals > .goal'))
}

export function getGoalParentElement () {
  return document.querySelector('.dashboard > .panel > .goals')
}

export function isGoalCollapsed (elem) {
  return Boolean(+elem.dataset.collapsed)
}
