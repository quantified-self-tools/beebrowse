import { getGoalParentElement } from './util'
import { renderGoalList } from './goals'

export default {
  init () {
    if (!getGoalParentElement()) return

    const expandCollapseSpacer = document.querySelector(
      '.expand-collapse + .spacer'
    )

    this.setSortFromQueryParam()

    document
      .querySelectorAll('.simple-sort-button')
      .forEach((elem) => elem.remove())

    document.querySelectorAll('.sort-button[data-sort-string]').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopImmediatePropagation()

        this.sortBy = el.dataset.sortString
      }, { capture: true })
    })

    const simpleSortBtn = document.createElement('a')
    simpleSortBtn.href = '#'
    simpleSortBtn.classList.add('simple-sort-button')
    simpleSortBtn.addEventListener('click', (event) => {
      event.preventDefault()
      this.sortBy = 'simple'
    })
    simpleSortBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="simple-sort-icon">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
      </svg>
      `
    expandCollapseSpacer.appendChild(simpleSortBtn)
  },

  get sortBy () {
    const arrows = document.querySelectorAll('.sort-arrow[data-sort-string]')
    for (const arrow of arrows) {
      if (arrow.classList.contains('octicon-triangle-down')) {
        return arrow.dataset.sortString
      }
    }
    return 'simple'
  },

  set sortBy (value) {
    const arrows = document.querySelectorAll('.sort-arrow[data-sort-string]')

    arrows.forEach((el) => {
      if (el.dataset.sortString === value) {
        el.classList.add('octicon-triangle-down')
      } else {
        el.classList.remove('octicon-triangle-down')
      }
    })

    renderGoalList()
  },
  setSortFromQueryParam () {
    const url = new URL(window.location.href)
    const sorting = url.searchParams.get('sorting')
    if (sorting) {
      if (sorting !== this.sortBy) {
        console.log(sorting)
        this.sortBy = sorting
      }

      url.searchParams.delete('sorting')
      window.history.replaceState({}, '', url)
    }
  }
}
