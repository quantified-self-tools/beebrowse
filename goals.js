import Sorting from './sorting'
import {
  getGoalElements,
  getGoalParentElement,
  sortGoals
} from './util'

export function renderGoalList () {
  const elems = getGoalElements()

  sortGoals(elems, Sorting.sortBy)

  const goalParent = getGoalParentElement()
  elems.forEach(elem => goalParent.append(elem))
}
