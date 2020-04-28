import Collapse from './collapse'
import Filter from './filter'
import Hotkeys from './hotkeys'

try {
  Collapse.init()
  Filter.init()
  Hotkeys.init()

  Hotkeys.on('filter', () => Filter.focusFilter())
  Hotkeys.on('escape-hide', elem => {
    elem.value = ''
    elem.blur()
  })
  Hotkeys.on('uncollapse-all', () => Collapse.uncollapseAll())
} catch (err) {
  console.error(err)
}
