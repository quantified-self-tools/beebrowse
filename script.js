import * as Collapse from "./collapse"
import * as Filter from "./filter"
import * as Hotkeys from "./hotkeys"
import Sorting from "./sorting"
import * as Interface from "./interface"

import { dispatch } from "./events"
import { clone } from "./util"

try {
  Collapse.init()
  Filter.init()
  Hotkeys.init()
  Sorting.init()

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
} catch (err) {
  console.error(err)
}
