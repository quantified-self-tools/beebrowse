import { describe, it, expect, beforeEach } from 'vitest'
import { futureDays, compare, createElement, createGoalLabel, sortGoals } from '../src/util'

describe('util.js - pure functions', () => {
  describe('compare', () => {
    it('returns 0 for equal values', () => {
      expect(compare(1, 1)).toBe(0)
      expect(compare('a', 'a')).toBe(0)
    })

    it('returns 1 when first value is greater', () => {
      expect(compare(2, 1)).toBe(1)
      expect(compare('b', 'a')).toBe(1)
    })

    it('returns -1 when first value is less', () => {
      expect(compare(1, 2)).toBe(-1)
      expect(compare('a', 'b')).toBe(-1)
    })
  })

  describe('futureDays', () => {
    it('calculates days until a future date', () => {
      const nowSeconds = Date.now() / 1000
      const oneDayFuture = nowSeconds + (60 * 60 * 24)
      expect(futureDays(oneDayFuture)).toBe(1)
    })

    it('returns 0 for today', () => {
      const nowSeconds = Date.now() / 1000
      expect(futureDays(nowSeconds)).toBe(0)
    })

    it('returns negative for past dates', () => {
      const nowSeconds = Date.now() / 1000
      const oneDayPast = nowSeconds - (60 * 60 * 24)
      expect(futureDays(oneDayPast)).toBe(-1)
    })
  })
})

describe('util.js - DOM functions', () => {
  beforeEach(() => {
    // Reset document body before each test
    document.body.innerHTML = ''
  })

  describe('createElement', () => {
    it('creates an element with tag name', () => {
      const elem = createElement('div')
      expect(elem.tagName).toBe('DIV')
    })

    it('sets text content when provided', () => {
      const elem = createElement('span', 'Hello')
      expect(elem.textContent).toBe('Hello')
    })

    it('applies properties from props object', () => {
      const elem = createElement('input', null, {
        className: 'test-class',
        id: 'test-id',
        placeholder: 'Enter text'
      })
      expect(elem.className).toBe('test-class')
      expect(elem.id).toBe('test-id')
      expect(elem.placeholder).toBe('Enter text')
    })
  })

  describe('createGoalLabel', () => {
    it('creates a label with baremin and days until losedate', () => {
      const nowSeconds = Date.now() / 1000
      const threeDaysFuture = nowSeconds + (60 * 60 * 24 * 3)

      const label = createGoalLabel({
        baremin: '5',
        losedate: threeDaysFuture.toString()
      })

      expect(label.tagName).toBe('SPAN')
      expect(label.className).toBe('small-description')
      expect(label.textContent).toBe(' (5/3d)')
    })
  })

  describe('sortGoals', () => {
    let goals

    beforeEach(() => {
      // Create mock goal elements with data attributes
      const createGoal = (slug, losedate, collapsed = '0', pledge = '0', lasttouch = '0', urgencykey = '0') => {
        const div = document.createElement('div')
        div.dataset.slug = slug
        div.dataset.losedate = losedate
        div.dataset.collapsed = collapsed
        div.dataset.pledge = pledge
        div.dataset.lasttouch = lasttouch
        div.dataset.urgencykey = urgencykey
        return div
      }

      const nowSeconds = Date.now() / 1000
      goals = [
        createGoal('goal-c', (nowSeconds + 3 * 24 * 60 * 60).toString()),
        createGoal('goal-a', (nowSeconds + 1 * 24 * 60 * 60).toString()),
        createGoal('goal-b', (nowSeconds + 2 * 24 * 60 * 60).toString()),
      ]
    })

    it('sorts by slug alphabetically', () => {
      sortGoals(goals, 'slug')
      expect(goals.map(g => g.dataset.slug)).toEqual(['goal-a', 'goal-b', 'goal-c'])
    })

    it('sorts by simple (losedate urgency)', () => {
      sortGoals(goals, 'simple')
      // Should be sorted by losedate (earliest first)
      expect(goals[0].dataset.slug).toBe('goal-a')
      expect(goals[1].dataset.slug).toBe('goal-b')
      expect(goals[2].dataset.slug).toBe('goal-c')
    })

    it('places collapsed goals after uncollapsed', () => {
      goals[0].dataset.collapsed = '1' // goal-c is collapsed

      sortGoals(goals, 'slug')

      // goal-a and goal-b first (uncollapsed), then goal-c (collapsed)
      expect(goals[0].dataset.slug).toBe('goal-a')
      expect(goals[1].dataset.slug).toBe('goal-b')
      expect(goals[2].dataset.slug).toBe('goal-c')
    })

    it('falls back to urgency for unknown sort string', () => {
      // Should not throw, should use urgency sort
      sortGoals(goals, 'invalid-sort')
      // Just verify it doesn't throw
      expect(goals).toHaveLength(3)
    })
  })
})
