import type { AggregateResult, Attraction, FamilyMember } from './types'

export const TOP_LIMIT = 33

export function moveItem(items: string[], from: number, to: number): string[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/* Picks are unlimited — choose everything you like, then drag favorites above
   the tally line. Only the first TOP_LIMIT entries score (see aggregate). */
export function addToRanking(items: string[], attractionId: string): string[] {
  if (items.includes(attractionId)) return items
  return [...items, attractionId]
}

/* ── Age weighting ────────────────────────────────────────────────────────────
   The youngest voice counts slightly more, the oldest slightly less.
   Weight interpolates linearly on age between the youngest (×1.15) and the
   oldest (×0.85) member who gave a birthday; members without one count ×1.
   December 24 twins answer oldest/youngest, which nudges their effective age
   so real birth order is honored. */

const YOUNGEST_WEIGHT = 1.15
const OLDEST_WEIGHT = 0.85
const TWIN_NUDGE_YEARS = 0.05

function effectiveAgeYears(member: FamilyMember, reference: Date): number | null {
  if (!member.birthday) return null
  const born = new Date(`${member.birthday}T00:00:00`)
  if (Number.isNaN(born.getTime())) return null
  const years = (reference.getTime() - born.getTime()) / (365.25 * 24 * 3600 * 1000)
  const nudge =
    member.twinOrder === 'oldest' ? TWIN_NUDGE_YEARS : member.twinOrder === 'youngest' ? -TWIN_NUDGE_YEARS : 0
  return years + nudge
}

export function memberWeight(member: FamilyMember, members: FamilyMember[], reference: Date): number {
  const ages = members
    .map((item) => effectiveAgeYears(item, reference))
    .filter((age): age is number => age !== null)
  const own = effectiveAgeYears(member, reference)
  if (own === null || ages.length < 2) return 1
  const min = Math.min(...ages)
  const max = Math.max(...ages)
  if (max === min) return 1
  return YOUNGEST_WEIGHT - (YOUNGEST_WEIGHT - OLDEST_WEIGHT) * ((own - min) / (max - min))
}

export function aggregateRankings(
  attractions: Attraction[],
  members: FamilyMember[],
  reference: Date = new Date(),
): AggregateResult[] {
  const order = new Map(attractions.map((item) => [item.id, item.order]))
  const scores = new Map<string, { points: number; ranks: number[]; first: number }>()

  members.forEach((member) => {
    const weight = memberWeight(member, members, reference)
    member.rankings.slice(0, TOP_LIMIT).forEach((id, index) => {
      const current = scores.get(id) ?? { points: 0, ranks: [], first: 0 }
      current.points += (TOP_LIMIT - index) * weight
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
