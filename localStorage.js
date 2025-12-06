export function loadCollapsed(slug) {
  const ls = localStorage["BeeBrowse/collapse/" + slug]
  return ls ? +ls : 0
}

export function storeCollapsed(slug, collapsed) {
  localStorage["BeeBrowse/collapse/" + slug] = collapsed
}
