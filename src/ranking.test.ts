import { describe, expect, it } from 'vitest'
import { addToRanking, aggregateRankings, moveItem, TOP_LIMIT } from './ranking'
import type { Attraction, FamilyMember } from './types'

const attractions = [
  { id: 'a', order: 1 },
  { id: 'b', order: 2 },
  { id: 'c', order: 3 },
] as Attraction[]

const member = (id: string, rankings: string[]): FamilyMember => ({
  id,
  name: id,
  rankings,
  updatedAt: '2026-08-24T00:00:00Z',
})

describe('ranking helpers', () => {
  it('adds unique picks with no upper cap', () => {
    expect(addToRanking(['a'], 'a')).toEqual(['a'])
    const full = Array.from({ length: TOP_LIMIT }, (_, i) => String(i))
    expect(addToRanking(full, 'extra')).toEqual([...full, 'extra'])
  })

  it('tallies only the top 33 — picks below the line score nothing', () => {
    const many = Array.from({ length: TOP_LIMIT + 2 }, (_, i) => `id${i}`)
    const items = many.map((id, i) => ({ id, order: i + 1 })) as Attraction[]
    const result = aggregateRankings(items, [member('one', many)])
    const scored = new Map(result.map((r) => [r.attractionId, r.points]))
    expect(scored.get('id0')).toBe(TOP_LIMIT)
    expect(scored.get(`id${TOP_LIMIT - 1}`)).toBe(1)
    expect(scored.has(`id${TOP_LIMIT}`)).toBe(false)
    expect(scored.has(`id${TOP_LIMIT + 1}`)).toBe(false)
  })

  it('moves a pick without mutating the source', () => {
    const source = ['a', 'b', 'c']
    expect(moveItem(source, 2, 0)).toEqual(['c', 'a', 'b'])
    expect(source).toEqual(['a', 'b', 'c'])
  })

  it('scores rank position and breaks exact score ties by shared interest', () => {
    const result = aggregateRankings(attractions, [
      member('one', ['a', 'b']),
      member('two', ['b', 'c']),
    ])
    expect(result.map((item) => item.attractionId)).toEqual(['b', 'a', 'c'])
    expect(result[0]).toMatchObject({ voters: 2, points: 65 })
  })

  it('weights the youngest voice up and the oldest down, twins by birth order', () => {
    const ref = new Date('2026-08-24T12:00:00Z')
    const oldest: FamilyMember = { ...member('isaac', ['a']), birthday: '1981-03-01' }
    const youngest: FamilyMember = { ...member('kid', ['b']), birthday: '2020-05-01' }
    const all = [oldest, youngest]
    const result = aggregateRankings(attractions, all, ref)
    const points = new Map(result.map((r) => [r.attractionId, r.points]))
    expect(points.get('a')).toBeCloseTo(33 * 0.85, 5)
    expect(points.get('b')).toBeCloseTo(33 * 1.15, 5)

    const anchor: FamilyMember = { ...member('anchor', ['c']), birthday: '1981-03-01' }
    const twinA: FamilyMember = { ...member('twinA', ['a']), birthday: '2016-12-24', twinOrder: 'oldest' }
    const twinB: FamilyMember = { ...member('twinB', ['b']), birthday: '2016-12-24', twinOrder: 'youngest' }
    const twins = aggregateRankings(attractions, [anchor, twinA, twinB], ref)
    const twinPoints = new Map(twins.map((r) => [r.attractionId, r.points]))
    expect(twinPoints.get('b')!).toBeGreaterThan(twinPoints.get('a')!)
  })

  it('members without a birthday count exactly ×1', () => {
    const ref = new Date('2026-08-24T12:00:00Z')
    const result = aggregateRankings(attractions, [
      { ...member('a1', ['a']), birthday: '1981-03-01' },
      { ...member('b1', ['b']), birthday: '2020-05-01' },
      member('c1', ['c']),
    ], ref)
    const points = new Map(result.map((r) => [r.attractionId, r.points]))
    expect(points.get('c')).toBe(33)
  })

  it('uses video order as the final deterministic tie-break', () => {
    const result = aggregateRankings(attractions, [member('one', ['a']), member('two', ['b'])])
    expect(result.map((item) => item.attractionId)).toEqual(['a', 'b'])
  })
})
