import Sorting from './sorting'
import { getGoalElements, getGoalParentElement, sortGoals } from './util'

export function renderGoalList () {
  const elems = getGoalElements()

  sortGoals(elems, Sorting.sortBy)

  resetTabIndexes(elems)

  const goalParent = getGoalParentElement()
  elems.forEach((elem) => goalParent.append(elem))
}

function resetTabIndexes (elems) {
  let tabindex = 1000
  elems.forEach((elem) => {
    elem.querySelectorAll(':is(select, input):not(:disabled)').forEach((el) => {
      el.tabIndex = tabindex++
    })
  })
}
