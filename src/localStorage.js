const GOAL_SNAPSHOT_KEY = "BeeBrowse/goals"
const WEEK_IN_SECONDS = 7 * 24 * 60 * 60

export function loadCollapsed(slug) {
  const ls = localStorage["BeeBrowse/collapse/" + slug]
  return ls ? +ls : 0
}

export function storeCollapsed(slug, collapsed) {
  localStorage["BeeBrowse/collapse/" + slug] = collapsed
}

export function loadBeeminderExpanded() {
  return localStorage["com.beeminder.dashboard.expandedList"] || ""
}

export function storeGoalsList(slugs) {
  const payload = {
    timestamp: Math.floor(Date.now() / 1000),
    slugs,
  }

  localStorage[GOAL_SNAPSHOT_KEY] = JSON.stringify(payload)
}

export function loadGoalsList() {
  const raw = localStorage[GOAL_SNAPSHOT_KEY]
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (
      !parsed ||
      typeof parsed.timestamp !== "number" ||
      !Array.isArray(parsed.slugs)
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function isGoalsListFresh(snapshot) {
  if (!snapshot || typeof snapshot.timestamp !== "number") return false

  const ageSeconds = Math.floor(Date.now() / 1000) - snapshot.timestamp
  return ageSeconds >= 0 && ageSeconds <= WEEK_IN_SECONDS
}
