import { createElement } from "./util"

const HELP_SHORTCUTS = [
  ["f", "Focus goal filter"],
  ["o", "Uncollapse all goals"],
  ["Esc", "Close goal filter"],
]

export function init() {
  const tableBody = document.querySelector(
    "#keyboard-help-modal .modal-body table tbody",
  )

  if (!tableBody || tableBody.querySelector("[data-beebrowse-keyboard-help]")) {
    return
  }

  const sectionHeadings = tableBody.querySelectorAll("tr.table-secondary")
  const generalHeading = sectionHeadings[sectionHeadings.length - 1]
  const beeBrowseRows = [
    createSectionHeading(),
    ...HELP_SHORTCUTS.map(createShortcutRow),
  ]

  if (generalHeading) {
    generalHeading.before(...beeBrowseRows)
  } else {
    tableBody.append(...beeBrowseRows)
  }
}

function createSectionHeading() {
  const row = createElement("tr", null, {
    className: "table-secondary",
  })
  row.dataset.beebrowseKeyboardHelp = "true"

  const cell = createElement("td", null, { colSpan: 2 })
  cell.append(createElement("strong", "BeeBrowse:"))
  row.append(cell)

  return row
}

function createShortcutRow([key, action]) {
  const row = createElement("tr")
  const keyCell = createElement("td")
  keyCell.append(createElement("kbd", key))
  row.append(keyCell, createElement("td", action))
  return row
}
