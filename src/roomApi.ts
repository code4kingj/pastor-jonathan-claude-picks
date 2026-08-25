import type { FamilyMember, FamilyRoom } from './types'

const endpoint = (import.meta.env.VITE_ROOM_API_URL as string | undefined)?.replace(/\/$/, '')
const LOCAL_KEY = 'pastor-jonathan-disney-room'
const LAST_ROOM_KEY = 'pastor-jonathan-last-room'

export interface RoomCredentials {
  id: string
  key: string
}

export const isSharedModeAvailable = Boolean(endpoint)

function localRoom(): FamilyRoom | null {
  const stored = localStorage.getItem(LOCAL_KEY)
  return stored ? (JSON.parse(stored) as FamilyRoom) : null
}

export async function createRoom(room: FamilyRoom): Promise<RoomCredentials> {
  if (!endpoint) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(room))
    return { id: room.id, key: 'local' }
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ room }),
  })
  if (!response.ok) throw new Error('The family room could not be created.')
  return (await response.json()) as RoomCredentials
}

export async function loadRoom(credentials: RoomCredentials): Promise<FamilyRoom> {
  if (!endpoint || credentials.key === 'local') {
    const room = localRoom()
    if (!room) throw new Error('This local family room is no longer on this device.')
    return room
  }
  const params = new URLSearchParams({ id: credentials.id, key: credentials.key })
  const response = await fetch(`${endpoint}?${params}`)
  if (!response.ok) throw new Error('This family room link is invalid or unavailable.')
  const payload = (await response.json()) as { room: FamilyRoom }
  return payload.room
}

export async function saveMember(
  credentials: RoomCredentials,
  room: FamilyRoom,
  member: FamilyMember,
): Promise<FamilyRoom> {
  if (!endpoint || credentials.key === 'local') {
    const current = localRoom() ?? room
    const members = current.members.some((item) => item.id === member.id)
      ? current.members.map((item) => (item.id === member.id ? member : item))
      : [...current.members, member]
    const next = { ...current, members, updatedAt: new Date().toISOString() }
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
    return next
  }
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...credentials, member }),
  })
  if (!response.ok) throw new Error('Your picks could not sync. They remain on this screen.')
  const payload = (await response.json()) as { room: FamilyRoom }
  return payload.room
}

export function parseRoomLink(): RoomCredentials | null {
  /* If the app opens without a room in the URL (typed the plain address,
     opened from history), fall back to the last room this device was in — so
     nobody accidentally lands on "Start our room" and strands their list. */
  const fromHash = window.location.hash.match(/^#room=([^.]+)\.([A-Za-z0-9_-]+)$/)
  if (fromHash) {
    localStorage.setItem(LAST_ROOM_KEY, window.location.hash)
    return { id: fromHash[1], key: fromHash[2] }
  }
  const stored = localStorage.getItem(LAST_ROOM_KEY)
  const fromStored = stored?.match(/^#room=([^.]+)\.([A-Za-z0-9_-]+)$/)
  if (fromStored) {
    window.location.hash = stored as string
    return { id: fromStored[1], key: fromStored[2] }
  }
  return null
}

export function setRoomLink(credentials: RoomCredentials) {
  const hash = `room=${credentials.id}.${credentials.key}`
  window.location.hash = hash
  localStorage.setItem(LAST_ROOM_KEY, `#${hash}`)
}
