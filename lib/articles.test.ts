import { describe, expect, it } from 'vitest'
import { getArticles, isLive } from './articles'

describe('isLive', () => {
  const now = new Date('2026-11-17T12:00:00Z')

  it('shows a published article dated today or earlier', () => {
    expect(isLive({ published: true, date: '2026-11-17' }, now)).toBe(true)
    expect(isLive({ published: true, date: '2026-04-04' }, now)).toBe(true)
  })

  it('holds back a published article dated in the future', () => {
    expect(isLive({ published: true, date: '2026-11-18' }, now)).toBe(false)
  })

  it('goes live at midnight UTC on its date', () => {
    expect(isLive({ published: true, date: '2026-11-18' }, new Date('2026-11-17T23:59:59Z'))).toBe(false)
    expect(isLive({ published: true, date: '2026-11-18' }, new Date('2026-11-18T00:00:00Z'))).toBe(true)
  })

  it('hides drafts and articles without a valid date', () => {
    expect(isLive({ published: false, date: '2026-01-01' }, now)).toBe(false)
    expect(isLive({ published: true }, now)).toBe(false)
    expect(isLive({ published: true, date: 'soon' }, now)).toBe(false)
  })
})

describe('getArticles', () => {
  it('only returns articles that are live on the given date', () => {
    const early = getArticles(new Date('2000-01-01T00:00:00Z'))
    const late = getArticles(new Date('2100-01-01T00:00:00Z'))
    expect(early).toHaveLength(0)
    expect(late.length).toBeGreaterThan(0)
  })

  it('sorts newest first', () => {
    const dates = getArticles(new Date('2100-01-01T00:00:00Z')).map((a) => new Date(a.date).getTime())
    expect(dates).toEqual([...dates].sort((a, b) => b - a))
  })
})
