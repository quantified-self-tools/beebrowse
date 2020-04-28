export default {
  loadCollapsed ({ slug }) {
    const ls = localStorage['BeeBrowse/collapse/' + slug]
    if (ls) return +ls
    else return 0
  },
  storeCollapsed ({ collapsed, slug }) {
    localStorage['BeeBrowse/collapse/' + slug] = collapsed
  }
}
