import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { findClosestSlugs, init } from "../src/404"

describe("findClosestSlugs", () => {
  // -- Edge cases --

  it("returns empty array when slugs is not an array", () => {
    expect(findClosestSlugs("foo", null, 3)).toEqual([])
    expect(findClosestSlugs("foo", undefined, 3)).toEqual([])
    expect(findClosestSlugs("foo", "bar", 3)).toEqual([])
  })

  it("returns empty array when slugs is empty", () => {
    expect(findClosestSlugs("foo", [], 3)).toEqual([])
  })

  it("respects the limit parameter", () => {
    const slugs = ["a", "ab", "abc", "abcd", "abcde"]
    expect(findClosestSlugs("a", slugs, 2)).toHaveLength(2)
  })

  // -- Normalization --

  it("normalizes case", () => {
    const result = findClosestSlugs("FOO", ["foo", "bar"], 3)
    expect(result[0]).toBe("foo")
  })

  it("normalizes underscores to hyphens", () => {
    const result = findClosestSlugs("foo_bar", ["foo-bar", "baz"], 3)
    expect(result[0]).toBe("foo-bar")
  })

  // -- Category 0: prefix --

  it("ranks prefix matches first", () => {
    const result = findClosestSlugs("work", ["workout", "rework", "workx"], 3)
    // 'workout' and 'workx' are prefix matches (cat 0), 'rework' is substring (cat 1)
    expect(result.indexOf("rework")).toBeGreaterThan(result.indexOf("workout"))
    expect(result.indexOf("rework")).toBeGreaterThan(result.indexOf("workx"))
  })

  // -- Category 1: substring --

  it("ranks substring matches above subsequence matches", () => {
    // target: 'read'
    // 'spread' contains 'read' as substring (cat 1)
    // 'r-e-a-d-x' has r,e,a,d as subsequence but not substring (cat 2)
    const result = findClosestSlugs("read", ["rxexaxdx", "spread"], 2)
    expect(result[0]).toBe("spread")
  })

  // -- Category 2: subsequence --

  it("ranks subsequence matches above multiset matches", () => {
    // target: 'abc'
    // 'axbxc' has a,b,c in order -> subsequence (cat 2)
    // 'cba' has all letters with right counts but not in order -> multiset (cat 3)
    const result = findClosestSlugs("abc", ["cba", "axbxc"], 2)
    expect(result[0]).toBe("axbxc")
    expect(result[1]).toBe("cba")
  })

  // -- Category 3: multiset --

  it("ranks multiset matches above set matches", () => {
    // target: 'aab'
    // 'baa' has a:2, b:1 — matches multiset (cat 3)
    // 'ab' has a and b present but only one 'a' — set match only (cat 4)
    const result = findClosestSlugs("aab", ["ab", "baa"], 2)
    expect(result[0]).toBe("baa")
    expect(result[1]).toBe("ab")
  })

  it("multiset match requires correct letter counts", () => {
    // target: 'aab' needs a:2, b:1
    // 'abx' has a:1, b:1 — not enough a's, so not multiset; but set match (has a and b)
    // 'baax' has a:2, b:1 — multiset match
    const result = findClosestSlugs("aab", ["abx", "baax"], 2)
    expect(result[0]).toBe("baax")
    expect(result[1]).toBe("abx")
  })

  // -- Category 4: set --

  it("ranks set matches above no-match", () => {
    // target: 'abc'
    // 'xbca' has {a,b,c} present -> set match (cat 4) — but wait, also multiset
    // Let's be more careful:
    // target: 'aabc' needs a:2,b:1,c:1
    // 'xbca' has a:1,b:1,c:1 — not multiset (only 1 a), but set match ({a,b,c} present)
    // 'xyz' has none of the letters -> no match (cat 5)
    const result = findClosestSlugs("aabc", ["xyz", "xbca"], 2)
    expect(result[0]).toBe("xbca")
    expect(result[1]).toBe("xyz")
  })

  it("set match only needs distinct letters present", () => {
    // target: 'aab' distinct letters: {a, b}
    // 'xbya' has a and b -> set match
    // 'xyz' has neither -> no match
    const result = findClosestSlugs("aab", ["xyz", "xbya"], 2)
    expect(result[0]).toBe("xbya")
  })

  // -- Category 5: no match --

  it("still returns no-match slugs sorted by levenshtein distance", () => {
    // target: 'abc', candidates share no structural similarity
    // 'abd' is edit distance 1 from 'abc'
    // 'xyz' is edit distance 3 from 'abc'
    const result = findClosestSlugs("abc", ["xyz", "abd"], 2)
    expect(result[0]).toBe("abd")
    expect(result[1]).toBe("xyz")
  })

  // -- Tiebreaking --

  it("breaks ties within a category by levenshtein distance", () => {
    // target: 'work'
    // 'workx' is prefix match, distance 1
    // 'workzzzz' is prefix match, distance 4
    const result = findClosestSlugs("work", ["workzzzz", "workx"], 2)
    expect(result[0]).toBe("workx")
    expect(result[1]).toBe("workzzzz")
  })

  it("breaks ties within category and distance by alphabetical order", () => {
    // target: 'x'
    // 'xb' and 'xa' are both prefix matches with same levenshtein distance
    const result = findClosestSlugs("x", ["xb", "xa"], 2)
    expect(result[0]).toBe("xa")
    expect(result[1]).toBe("xb")
  })

  // -- Full ranking integration --

  it("ranks all categories in correct order", () => {
    // target: 'abc'
    // 'abcdef'  -> prefix (cat 0)
    // 'xabcy'   -> substring (cat 1)
    // 'axbxcx'  -> subsequence (cat 2)
    // 'cbax'    -> multiset (cat 3): has a:1,b:1,c:1 matching target counts, not in order
    // 'aabbcc'  -> subsequence actually (a..b..c in order) — need a better example
    // Let's use target 'abc':
    // 'cba' -> not subsequence (c,b,a not in order a,b,c), multiset (a:1,b:1,c:1) -> cat 3
    // For set-only, need target with repeated letter:
    // target: 'aabc' (a:2,b:1,c:1)
    // 'aabcx'    -> prefix (cat 0)
    // 'xaabcy'   -> substring (cat 1)
    // 'axaxbxcx' -> subsequence (cat 2)
    // 'cbaa'     -> multiset (cat 3): a:2,b:1,c:1 all present with counts
    // 'xbca'     -> set (cat 4): has {a,b,c} but only 1 a
    // 'zzzz'     -> no match (cat 5)
    const result = findClosestSlugs(
      "aabc",
      [
        "zzzz", // cat 5
        "xbca", // cat 4
        "cbaa", // cat 3
        "axaxbxcx", // cat 2
        "xaabcy", // cat 1
        "aabcx", // cat 0
      ],
      6,
    )

    expect(result).toEqual([
      "aabcx", // cat 0: prefix
      "xaabcy", // cat 1: substring
      "axaxbxcx", // cat 2: subsequence
      "cbaa", // cat 3: multiset
      "xbca", // cat 4: set
      "zzzz", // cat 5: none
    ])
  })
})

describe("findClosestSlugs - normalization and category boundaries", () => {
  // Target normalization: '_' must become '-' before comparison.
  it("normalizes the target underscores to hyphens before ranking", () => {
    const result = findClosestSlugs("foo_bar", ["foo-bar", "foobar"], 2)
    expect(result[0]).toBe("foo-bar")
  })

  // Slug normalization: a candidate's '_' must become '-' too.
  it("normalizes candidate underscores to hyphens before ranking", () => {
    const result = findClosestSlugs("a_b", ["a_b", "a-bee"], 2)
    expect(result[0]).toBe("a_b")
  })

  // Substring (cat 1) must rank above subsequence (cat 2) even when the
  // substring match is the more edit-distant candidate.
  it("treats a substring match as strictly better than a subsequence match", () => {
    const result = findClosestSlugs("ab", ["xxabxx", "axb"], 2)
    expect(result[0]).toBe("xxabxx")
  })

  // Subsequence (cat 2) must rank above multiset (cat 3) even when more distant.
  it("treats a subsequence match as strictly better than a multiset match", () => {
    const result = findClosestSlugs("ab", ["axxxxb", "ba"], 2)
    expect(result[0]).toBe("axxxxb")
  })

  // isSetOf requires EVERY distinct target letter to be present, not just one.
  it("requires all distinct letters for a set match, not merely one", () => {
    // 'aq' has only 'a' (not a full set match -> cat 5); 'abqqqqqqqq' has the
    // full {a,b} set (cat 4) and must therefore outrank 'aq'.
    const result = findClosestSlugs("aab", ["aq", "abqqqqqqqq"], 2)
    expect(result[0]).toBe("abqqqqqqqq")
  })
})

describe("404 init - suggestion rendering", () => {
  let originalHref

  function storeSnapshot(slugs, { ageSeconds = 0 } = {}) {
    const timestamp = Math.floor(Date.now() / 1000) - ageSeconds
    localStorage["BeeBrowse/goals"] = JSON.stringify({ timestamp, slugs })
  }

  function errorPage(innerHtml = '<div class="inner"></div>') {
    document.body.innerHTML = `
      <div class="error-page-container">
        <div class="message">${innerHtml}</div>
      </div>
    `
  }

  beforeEach(() => {
    originalHref = window.location.href
    localStorage.clear()
    window.history.replaceState({}, "", "/alice/running")
  })

  afterEach(() => {
    window.history.replaceState({}, "", originalHref)
    document.body.innerHTML = ""
  })

  it("renders ranked suggestion links into the message container", () => {
    storeSnapshot(["runnin", "run", "xyz"])
    errorPage()

    init()

    const wrapper = document.querySelector(
      ".message .inner .beebrowse-suggestions",
    )
    expect(wrapper).not.toBeNull()
    expect(wrapper.querySelector("p.center").textContent).toBe(
      "Maybe you were looking for one of these:",
    )

    const links = wrapper.querySelectorAll("ol.beebrowse-suggestions-list li a")
    expect(Array.from(links).map((a) => a.textContent)).toEqual([
      "runnin",
      "run",
      "xyz",
    ])
    // Links point at the goal under the same username from the URL.
    expect(links[0].getAttribute("href")).toBe("/alice/runnin")
    expect(links[0].className).toBe("dark")
  })

  it("falls back to the message row itself when it has no child element", () => {
    storeSnapshot(["runnin"])
    errorPage("") // message row has no element children

    init()

    expect(
      document.querySelector(".message > .beebrowse-suggestions"),
    ).not.toBeNull()
  })

  it("does nothing when there is no error page", () => {
    storeSnapshot(["runnin"])
    document.body.innerHTML =
      '<div class="message"><div class="inner"></div></div>'

    init()

    expect(document.querySelector(".beebrowse-suggestions")).toBeNull()
  })

  it("does nothing when the stored snapshot is stale", () => {
    storeSnapshot(["runnin"], { ageSeconds: 8 * 24 * 60 * 60 })
    errorPage()

    init()

    expect(document.querySelector(".beebrowse-suggestions")).toBeNull()
  })

  it("does nothing when there are no slugs to suggest", () => {
    storeSnapshot([])
    errorPage()

    init()

    expect(document.querySelector(".beebrowse-suggestions")).toBeNull()
  })

  it("does nothing when the message container is missing", () => {
    storeSnapshot(["runnin"])
    document.body.innerHTML = '<div class="error-page-container"></div>'

    init()

    expect(document.querySelector(".beebrowse-suggestions")).toBeNull()
  })

  it("does not insert a second suggestion block when run twice", () => {
    storeSnapshot(["runnin", "run"])
    errorPage()

    init()
    init()

    expect(document.querySelectorAll(".beebrowse-suggestions")).toHaveLength(1)
  })
})
