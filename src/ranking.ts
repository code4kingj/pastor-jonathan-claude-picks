import type { AggregateResult, Attraction, FamilyMember } from './types'

export const TOP_LIMIT = 33

export function moveItem(items: string[], from: number, to: number): string[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function addToRanking(items: string[], attractionId: string): string[] {
  if (items.includes(attractionId) || items.length >= TOP_LIMIT) return items
  return [...items, attractionId]
}

export function aggregateRankings(
  attractions: Attraction[],
  members: FamilyMember[],
): AggregateResult[] {
  const order = new Map(attractions.map((item) => [item.id, item.order]))
  const scores = new Map<string, { points: number; ranks: number[]; first: number }>()

  members.forEach((member) => {
    member.rankings.slice(0, TOP_LIMIT).forEach((id, index) => {
      const current = scores.get(id) ?? { points: 0, ranks: [], first: 0 }
      current.points += TOP_LIMIT - index
      current.ranks.push(index + 1)
      if (index === 0) current.first += 1
      scores.set(id, current)
    })
  })

  return [...scores.entries()]
    .map(([attractionId, score]) => ({
      attractionId,
      points: score.points,
      voters: score.ranks.length,
      firstPlaceVotes: score.first,
      averageRank: score.ranks.reduce((sum, value) => sum + value, 0) / score.ranks.length,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.voters - a.voters ||
        b.firstPlaceVotes - a.firstPlaceVotes ||
        a.averageRank - b.averageRank ||
        (order.get(a.attractionId) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.attractionId) ?? Number.MAX_SAFE_INTEGER),
    )
}
