import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadCollapsed,
  storeCollapsed,
  loadBeeminderExpanded,
  storeGoalsList,
  loadGoalsList,
  isGoalsListFresh,
} from '../src/localStorage'

const WEEK_IN_SECONDS = 7 * 24 * 60 * 60
// A fixed "now" so timestamp maths are exactly assertable.
const NOW_MS = 1_700_000_000_000
const NOW_SECONDS = Math.floor(NOW_MS / 1000)

describe('localStorage.js', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadCollapsed', () => {
    it('reads the value stored under the per-slug collapse key as a number', () => {
      localStorage['BeeBrowse/collapse/run'] = '1'
      const result = loadCollapsed('run')
      expect(result).toBe(1)
      // A number, not the raw "1" string (kills the unary-plus removal).
      expect(typeof result).toBe('number')
    })

    it('returns 0 when no value is stored for that slug', () => {
      localStorage['BeeBrowse/collapse/other'] = '1'
      // Querying a different slug must not see "other"'s value.
      expect(loadCollapsed('missing')).toBe(0)
    })
  })

  describe('storeCollapsed', () => {
    it('writes under the per-slug collapse key', () => {
      storeCollapsed('write', 1)
      expect(localStorage['BeeBrowse/collapse/write']).toBe('1')
      expect(localStorage['BeeBrowse/collapse/other']).toBeUndefined()
    })

    it('round-trips with loadCollapsed', () => {
      storeCollapsed('round', 1)
      expect(loadCollapsed('round')).toBe(1)
    })
  })

  describe('loadBeeminderExpanded', () => {
    it('returns the stored expanded list', () => {
      localStorage['com.beeminder.dashboard.expandedList'] = 'a,b,c'
      expect(loadBeeminderExpanded()).toBe('a,b,c')
    })

    it('returns an empty string when nothing is stored', () => {
      expect(loadBeeminderExpanded()).toBe('')
    })
  })

  describe('storeGoalsList', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(NOW_MS)
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('stores the slugs and a current unix-seconds timestamp as JSON', () => {
      storeGoalsList(['alpha', 'beta'])

      const parsed = JSON.parse(localStorage['BeeBrowse/goals'])
      expect(parsed.slugs).toEqual(['alpha', 'beta'])
      expect(parsed.timestamp).toBe(NOW_SECONDS)
    })
  })

  describe('loadGoalsList', () => {
    it('returns null when nothing is stored', () => {
      expect(loadGoalsList()).toBeNull()
    })

    it('returns null on malformed JSON', () => {
      localStorage['BeeBrowse/goals'] = 'not-json{'
      expect(loadGoalsList()).toBeNull()
    })

    it('returns null when the parsed value is JSON null', () => {
      localStorage['BeeBrowse/goals'] = 'null'
      expect(loadGoalsList()).toBeNull()
    })

    it('returns null when the timestamp is not a number', () => {
      localStorage['BeeBrowse/goals'] = JSON.stringify({
        timestamp: 'soon',
        slugs: ['a'],
      })
      expect(loadGoalsList()).toBeNull()
    })

    it('returns null when slugs is not an array', () => {
      localStorage['BeeBrowse/goals'] = JSON.stringify({
        timestamp: NOW_SECONDS,
        slugs: 'a,b',
      })
      expect(loadGoalsList()).toBeNull()
    })

    it('returns the parsed snapshot when valid', () => {
      const snapshot = { timestamp: NOW_SECONDS, slugs: ['a', 'b'] }
      localStorage['BeeBrowse/goals'] = JSON.stringify(snapshot)
      expect(loadGoalsList()).toEqual(snapshot)
    })
  })

  describe('isGoalsListFresh', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(NOW_MS)
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns false for a missing snapshot', () => {
      expect(isGoalsListFresh(null)).toBe(false)
      expect(isGoalsListFresh(undefined)).toBe(false)
    })

    it('returns false when the timestamp is not a number', () => {
      expect(isGoalsListFresh({ timestamp: 'nope' })).toBe(false)
    })

    it('rejects a non-number timestamp BEFORE doing the age arithmetic', () => {
      // A numeric string equal to "now" would coerce into a fresh age if the
      // typeof guard were skipped, so this pins that the guard short-circuits.
      expect(isGoalsListFresh({ timestamp: String(NOW_SECONDS) })).toBe(false)
    })

    it('returns true for a snapshot stamped right now (age 0)', () => {
      expect(isGoalsListFresh({ timestamp: NOW_SECONDS })).toBe(true)
    })

    it('returns true at exactly one week old (inclusive boundary)', () => {
      expect(isGoalsListFresh({ timestamp: NOW_SECONDS - WEEK_IN_SECONDS })).toBe(
        true,
      )
    })

    it('returns false just past one week old', () => {
      expect(
        isGoalsListFresh({ timestamp: NOW_SECONDS - WEEK_IN_SECONDS - 1 }),
      ).toBe(false)
    })

    it('returns false for a future timestamp (negative age)', () => {
      expect(isGoalsListFresh({ timestamp: NOW_SECONDS + 1 })).toBe(false)
    })
  })
})
