import { isGoalsListFresh, loadGoalsList } from "./localStorage"

export function init() {
  const missingGoal = getMissingGoalInfo()
  if (!missingGoal) return

  const snapshot = loadGoalsList()
  if (!isGoalsListFresh(snapshot)) return

  const suggestions = findClosestSlugs(missingGoal.slug, snapshot.slugs, 3)
  if (!suggestions.length) return

  const messageRow = document.querySelector(".error-page-container .message")
  if (!messageRow) return

  const messageContainer = messageRow.lastElementChild || messageRow
  if (messageContainer.querySelector(".beebrowse-suggestions")) return

  const wrapper = document.createElement("div")
  wrapper.className = "beebrowse-suggestions"

  const header = document.createElement("p")
  header.className = "center"
  header.textContent = "Maybe you were looking for one of these:"
  wrapper.appendChild(header)

  const list = document.createElement("ol")
  list.className = "beebrowse-suggestions-list"

  suggestions.forEach((slug) => {
    const listItem = document.createElement("li")
    const link = document.createElement("a")
    link.href = `/${missingGoal.username}/${slug}`
    link.className = "dark"
    link.textContent = slug
    listItem.appendChild(link)
    list.appendChild(listItem)
  })

  wrapper.appendChild(list)
  messageContainer.appendChild(wrapper)
}

function getMissingGoalInfo() {
  if (!document.querySelector(".error-page-container")) return null

  const pathParts = window.location.pathname.split("/").filter(Boolean)
  if (pathParts.length < 2) return null

  const [username, slug] = pathParts

  if (!username || !slug) return null
  return { username, slug }
}

function findClosestSlugs(targetSlug, slugs, limit) {
  if (!Array.isArray(slugs) || !slugs.length) return []

  const normalizedTarget = targetSlug.toLowerCase().replace(/_/g, "-")

  const scored = slugs.map((slug) => {
    const normalizedSlug = String(slug).toLowerCase().replace(/_/g, "-")
    return {
      slug,
      category: similarityCategory(normalizedTarget, normalizedSlug),
      distance: levenshtein(normalizedTarget, normalizedSlug),
    }
  })

  scored.sort(
    (a, b) =>
      a.category - b.category ||
      a.distance - b.distance ||
      a.slug.localeCompare(b.slug, "en", { sensitivity: "base" }),
  )

  return scored.slice(0, limit).map((entry) => entry.slug)
}

function similarityCategory(target, candidate) {
  if (candidate.startsWith(target)) return 0
  if (candidate.includes(target)) return 1
  if (isSubsequence(target, candidate)) return 2
  return 3
}

function isSubsequence(target, candidate) {
  let i = 0
  for (let j = 0; j < candidate.length && i < target.length; j++) {
    if (target[i] === candidate[j]) i++
  }
  return i === target.length
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const prevRow = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i++) {
    let prevDiagonal = prevRow[0]
    prevRow[0] = i

    for (let j = 1; j <= b.length; j++) {
      const temp = prevRow[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      prevRow[j] = Math.min(
        prevRow[j] + 1, // deletion
        prevRow[j - 1] + 1, // insertion
        prevDiagonal + cost, // substitution
      )
      prevDiagonal = temp
    }
  }

  return prevRow[b.length]
}
