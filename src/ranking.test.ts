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
  it('adds unique picks and enforces Top 33', () => {
    expect(addToRanking(['a'], 'a')).toEqual(['a'])
    const full = Array.from({ length: TOP_LIMIT }, (_, i) => String(i))
    expect(addToRanking(full, 'extra')).toEqual(full)
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

  it('uses video order as the final deterministic tie-break', () => {
    const result = aggregateRankings(attractions, [member('one', ['a']), member('two', ['b'])])
    expect(result.map((item) => item.attractionId)).toEqual(['a', 'b'])
  })
})
