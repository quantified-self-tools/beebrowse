import { describe, it, expect } from 'vitest'
import { findClosestSlugs } from '../src/404'

describe('findClosestSlugs', () => {
  // -- Edge cases --

  it('returns empty array when slugs is not an array', () => {
    expect(findClosestSlugs('foo', null, 3)).toEqual([])
    expect(findClosestSlugs('foo', undefined, 3)).toEqual([])
    expect(findClosestSlugs('foo', 'bar', 3)).toEqual([])
  })

  it('returns empty array when slugs is empty', () => {
    expect(findClosestSlugs('foo', [], 3)).toEqual([])
  })

  it('respects the limit parameter', () => {
    const slugs = ['a', 'ab', 'abc', 'abcd', 'abcde']
    expect(findClosestSlugs('a', slugs, 2)).toHaveLength(2)
  })

  // -- Normalization --

  it('normalizes case', () => {
    const result = findClosestSlugs('FOO', ['foo', 'bar'], 3)
    expect(result[0]).toBe('foo')
  })

  it('normalizes underscores to hyphens', () => {
    const result = findClosestSlugs('foo_bar', ['foo-bar', 'baz'], 3)
    expect(result[0]).toBe('foo-bar')
  })

  // -- Category 0: prefix --

  it('ranks prefix matches first', () => {
    const result = findClosestSlugs('work', ['workout', 'rework', 'workx'], 3)
    // 'workout' and 'workx' are prefix matches (cat 0), 'rework' is substring (cat 1)
    expect(result.indexOf('rework')).toBeGreaterThan(result.indexOf('workout'))
    expect(result.indexOf('rework')).toBeGreaterThan(result.indexOf('workx'))
  })

  // -- Category 1: substring --

  it('ranks substring matches above subsequence matches', () => {
    // target: 'read'
    // 'spread' contains 'read' as substring (cat 1)
    // 'r-e-a-d-x' has r,e,a,d as subsequence but not substring (cat 2)
    const result = findClosestSlugs('read', ['rxexaxdx', 'spread'], 2)
    expect(result[0]).toBe('spread')
  })

  // -- Category 2: subsequence --

  it('ranks subsequence matches above multiset matches', () => {
    // target: 'abc'
    // 'axbxc' has a,b,c in order -> subsequence (cat 2)
    // 'cba' has all letters with right counts but not in order -> multiset (cat 3)
    const result = findClosestSlugs('abc', ['cba', 'axbxc'], 2)
    expect(result[0]).toBe('axbxc')
    expect(result[1]).toBe('cba')
  })

  // -- Category 3: multiset --

  it('ranks multiset matches above set matches', () => {
    // target: 'aab'
    // 'baa' has a:2, b:1 — matches multiset (cat 3)
    // 'ab' has a and b present but only one 'a' — set match only (cat 4)
    const result = findClosestSlugs('aab', ['ab', 'baa'], 2)
    expect(result[0]).toBe('baa')
    expect(result[1]).toBe('ab')
  })

  it('multiset match requires correct letter counts', () => {
    // target: 'aab' needs a:2, b:1
    // 'abx' has a:1, b:1 — not enough a's, so not multiset; but set match (has a and b)
    // 'baax' has a:2, b:1 — multiset match
    const result = findClosestSlugs('aab', ['abx', 'baax'], 2)
    expect(result[0]).toBe('baax')
    expect(result[1]).toBe('abx')
  })

  // -- Category 4: set --

  it('ranks set matches above no-match', () => {
    // target: 'abc'
    // 'xbca' has {a,b,c} present -> set match (cat 4) — but wait, also multiset
    // Let's be more careful:
    // target: 'aabc' needs a:2,b:1,c:1
    // 'xbca' has a:1,b:1,c:1 — not multiset (only 1 a), but set match ({a,b,c} present)
    // 'xyz' has none of the letters -> no match (cat 5)
    const result = findClosestSlugs('aabc', ['xyz', 'xbca'], 2)
    expect(result[0]).toBe('xbca')
    expect(result[1]).toBe('xyz')
  })

  it('set match only needs distinct letters present', () => {
    // target: 'aab' distinct letters: {a, b}
    // 'xbya' has a and b -> set match
    // 'xyz' has neither -> no match
    const result = findClosestSlugs('aab', ['xyz', 'xbya'], 2)
    expect(result[0]).toBe('xbya')
  })

  // -- Category 5: no match --

  it('still returns no-match slugs sorted by levenshtein distance', () => {
    // target: 'abc', candidates share no structural similarity
    // 'abd' is edit distance 1 from 'abc'
    // 'xyz' is edit distance 3 from 'abc'
    const result = findClosestSlugs('abc', ['xyz', 'abd'], 2)
    expect(result[0]).toBe('abd')
    expect(result[1]).toBe('xyz')
  })

  // -- Tiebreaking --

  it('breaks ties within a category by levenshtein distance', () => {
    // target: 'work'
    // 'workx' is prefix match, distance 1
    // 'workzzzz' is prefix match, distance 4
    const result = findClosestSlugs('work', ['workzzzz', 'workx'], 2)
    expect(result[0]).toBe('workx')
    expect(result[1]).toBe('workzzzz')
  })

  it('breaks ties within category and distance by alphabetical order', () => {
    // target: 'x'
    // 'xb' and 'xa' are both prefix matches with same levenshtein distance
    const result = findClosestSlugs('x', ['xb', 'xa'], 2)
    expect(result[0]).toBe('xa')
    expect(result[1]).toBe('xb')
  })

  // -- Full ranking integration --

  it('ranks all categories in correct order', () => {
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
    const result = findClosestSlugs('aabc', [
      'zzzz',       // cat 5
      'xbca',       // cat 4
      'cbaa',       // cat 3
      'axaxbxcx',   // cat 2
      'xaabcy',     // cat 1
      'aabcx',      // cat 0
    ], 6)

    expect(result).toEqual([
      'aabcx',      // cat 0: prefix
      'xaabcy',     // cat 1: substring
      'axaxbxcx',   // cat 2: subsequence
      'cbaa',       // cat 3: multiset
      'xbca',       // cat 4: set
      'zzzz',       // cat 5: none
    ])
  })
})
