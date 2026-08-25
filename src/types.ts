export type Park = 'Magic Kingdom' | 'Animal Kingdom' | 'EPCOT' | 'Hollywood Studios'

export type AttractionCategory =
  | 'Ride'
  | 'Show'
  | 'Character'
  | 'Walkthrough'
  | 'Animals'
  | 'Transportation'
  | 'Experience'

export interface Attraction {
  id: string
  order: number
  name: string
  timestamp: number
  timestampLabel: string
  park: Park
  area: string
  category: AttractionCategory
  description: string
  availability: 'Open' | 'Coming soon' | 'Seasonal' | 'Unknown'
  availabilityNote?: string
  confidence: 'high' | 'medium' | 'low'
  image?: string
}

export interface FamilyMember {
  id: string
  name: string
  rankings: string[]
  updatedAt: string
  /* the design this member currently has selected (drives the theme poll) */
  theme?: string
  /* YYYY-MM-DD; drives age weighting (younger counts slightly more) */
  birthday?: string
  /* December 24 twins: real birth order for the age weighting */
  twinOrder?: 'oldest' | 'youngest'
}

export interface FamilyRoom {
  version: 1
  id: string
  title: string
  videoId: string
  members: FamilyMember[]
  createdAt: string
  updatedAt: string
}

export interface AggregateResult {
  attractionId: string
  points: number
  voters: number
  firstPlaceVotes: number
  averageRank: number
}
