import * as Collapse from "./collapse"
import * as Filter from "./filter"
import * as Hotkeys from "./hotkeys"
import * as Sorting from "./sorting"
import * as Interface from "./interface"
import { storeGoalsList } from "./localStorage"
import * as NotFound from "./404"

import { dispatch } from "./events"
import { clone, getGoalElements, getGoalParentElement } from "./util"

export function init() {
  Collapse.init()
  Filter.init()
  Hotkeys.init()
  Sorting.init()

  recordGoalsList()
  NotFound.init()

  Hotkeys.on("filter", () => Filter.focusFilter())
  Hotkeys.on("escape-hide", (elem) => {
    elem.value = ""
    elem.blur()
  })
  Hotkeys.on("uncollapse-all", () => Collapse.uncollapseAll())

  dispatch("init")
  if (window.wrappedJSObject) {
    window.wrappedJSObject.BeeBrowse = clone(Interface, {
      cloneFunctions: true,
    })
  }
}

function recordGoalsList() {
  if (!getGoalParentElement()) return

  const slugs = getGoalElements().map((elem) => elem.dataset.slug)
  storeGoalsList(slugs)
}
