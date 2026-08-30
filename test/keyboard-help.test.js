import { describe, it, expect, beforeEach } from "vitest"
import { init as initHotkeys } from "../src/hotkeys"
import { init as initKeyboardHelp } from "../src/keyboard-help"

function setupKeyboardHelp() {
  document.body.innerHTML = `
    <div class="modal fade" id="keyboard-help-modal" style="display: none">
      <div class="modal-body">
        <table><tbody>
          <tr class="table-secondary"><td colspan="2"><strong>Goals:</strong></td></tr>
          <tr><td><kbd>?</kbd></td><td>Show this help</td></tr>
          <tr class="table-secondary"><td colspan="2"><strong>General:</strong></td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Close this help</td></tr>
        </tbody></table>
      </div>
    </div>
  `
}

describe("keyboard-help.js", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("adds BeeBrowse shortcuts to Beeminder's hidden keyboard help", () => {
    setupKeyboardHelp()

    initKeyboardHelp()

    const rows = Array.from(
      document.querySelectorAll("#keyboard-help-modal tbody tr"),
    )
    expect(rows).toHaveLength(8)
    expect(rows[2].textContent).toBe("BeeBrowse:")
    expect(rows.slice(3, 6).map((row) => row.textContent)).toEqual([
      "fFocus goal filter",
      "oUncollapse all goals",
      "EscClose goal filter",
    ])
    expect(rows[6].textContent).toBe("General:")
  })

  it("does not duplicate the BeeBrowse section when initialized twice", () => {
    setupKeyboardHelp()

    initKeyboardHelp()
    initKeyboardHelp()

    expect(
      document.querySelectorAll("[data-beebrowse-keyboard-help]"),
    ).toHaveLength(1)
    expect(
      document.querySelectorAll("#keyboard-help-modal tbody tr"),
    ).toHaveLength(8)
  })

  it("does nothing when the Beeminder keyboard help is absent", () => {
    expect(() => initKeyboardHelp()).not.toThrow()
  })

  it("is installed as part of hotkey initialization", () => {
    setupKeyboardHelp()
    let keydownListener
    const realAdd = window.addEventListener.bind(window)
    window.addEventListener = (type, listener, options) => {
      if (type === "keydown") keydownListener = listener
      return realAdd(type, listener, options)
    }

    try {
      initHotkeys()
      expect(
        document.querySelector("[data-beebrowse-keyboard-help]"),
      ).not.toBeNull()
    } finally {
      window.addEventListener = realAdd
      if (keydownListener) {
        window.removeEventListener("keydown", keydownListener)
      }
    }
  })
})
