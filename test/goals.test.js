import { describe, it, expect, beforeEach } from 'vitest'
import { renderGoalList } from '../src/goals'

const DAY = 24 * 60 * 60

function buildGoal(slug, daysAhead, controlsHtml = '') {
  const goal = document.createElement('div')
  goal.className = 'goal'
  goal.dataset.slug = slug
  goal.dataset.losedate = String(Math.floor(Date.now() / 1000) + daysAhead * DAY)
  goal.innerHTML = controlsHtml
  return goal
}

function order() {
  return Array.from(document.querySelectorAll('.goals > .goal')).map(
    (g) => g.dataset.slug,
  )
}

describe('goals.js - renderGoalList', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="dashboard"><div class="panel"><div class="goals"></div></div></div>
    `
  })

  function mount(goals) {
    const parent = document.querySelector('.goals')
    goals.forEach((g) => parent.appendChild(g))
  }

  it('reorders the goals in the DOM by urgency (default "simple" sort)', () => {
    // DOM order c(3d), a(1d), b(2d); expected sorted order a, b, c.
    mount([buildGoal('c', 3), buildGoal('a', 1), buildGoal('b', 2)])

    renderGoalList()

    expect(order()).toEqual(['a', 'b', 'c'])
  })

  it('assigns sequential tab indexes from 1000, skipping disabled controls', () => {
    mount([
      buildGoal('b', 1, '<input id="b1">'),
      buildGoal(
        'a',
        2,
        '<select id="a1"></select><input id="a2" disabled><input id="a3">',
      ),
    ])
    // After sorting by losedate: b (1d) first, then a (2d).
    renderGoalList()

    expect(order()).toEqual(['b', 'a'])

    expect(document.getElementById('b1').tabIndex).toBe(1000)
    // a's controls continue the sequence in document order, disabled one skipped.
    expect(document.getElementById('a1').tabIndex).toBe(1001)
    expect(document.getElementById('a3').tabIndex).toBe(1002)
    // The disabled input must not get a sequence value.
    expect(document.getElementById('a2').tabIndex).toBeLessThan(1000)
  })
})
