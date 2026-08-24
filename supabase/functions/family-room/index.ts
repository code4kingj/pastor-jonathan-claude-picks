import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'cache-control': 'no-store',
}
const bucket = 'birthday-family-rooms'
const roomPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const memberPattern = roomPattern

type FamilyMember = {
  id: string
  name: string
  rankings: string[]
  updatedAt: string
}

type FamilyRoom = {
  version: number
  id: string
  title: string
  videoId: string
  members: FamilyMember[]
  createdAt: string
  updatedAt: string
}

type StoredMeta = {
  keyHash: string
  room: Omit<FamilyRoom, 'members'>
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json; charset=utf-8' },
  })
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function makeSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function validMember(value: unknown): value is FamilyMember {
  if (!value || typeof value !== 'object') return false
  const member = value as Partial<FamilyMember>
  return Boolean(
    typeof member.id === 'string' && memberPattern.test(member.id) &&
    typeof member.name === 'string' && member.name.trim().length > 0 && member.name.trim().length <= 32 &&
    Array.isArray(member.rankings) && member.rankings.length <= 33 &&
    member.rankings.every((id) => typeof id === 'string' && id.length <= 100) &&
    new Set(member.rankings).size === member.rankings.length,
  )
}

function validRoom(value: unknown): value is FamilyRoom {
  if (!value || typeof value !== 'object') return false
  const room = value as Partial<FamilyRoom>
  return Boolean(
    room.version === 1 &&
    typeof room.id === 'string' && roomPattern.test(room.id) &&
    typeof room.title === 'string' && room.title.length <= 100 &&
    room.videoId === 'Ok72hT9iOpY' &&
    Array.isArray(room.members) && room.members.length === 1 && validMember(room.members[0]),
  )
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) return json({ error: 'Method not allowed' }, 405)

  const projectUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!projectUrl || !serviceKey) return json({ error: 'Server configuration unavailable' }, 500)
  const supabase = createClient(projectUrl, serviceKey, { auth: { persistSession: false } })
  const ensured = await supabase.storage.createBucket(bucket, { public: false, fileSizeLimit: 262144 })
  if (ensured.error && !/already exists/i.test(ensured.error.message)) return json({ error: 'Room storage unavailable' }, 500)

  async function readMeta(id: string): Promise<StoredMeta | null> {
    const { data, error } = await supabase.storage.from(bucket).download(`rooms/${id}/meta.json`)
    if (error || !data) return null
    try { return JSON.parse(await data.text()) as StoredMeta } catch { return null }
  }

  async function authorizedMeta(id: string, key: string) {
    if (!roomPattern.test(id) || key.length < 40 || key.length > 80) return null
    const meta = await readMeta(id)
    if (!meta || meta.keyHash !== await sha256(key)) return null
    return meta
  }

  async function assemble(id: string, meta: StoredMeta): Promise<FamilyRoom> {
    const prefix = `rooms/${id}/members`
    const { data: files, error } = await supabase.storage.from(bucket).list(prefix, { limit: 100, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw error
    const members = (await Promise.all((files ?? []).filter((file) => file.name.endsWith('.json')).map(async (file) => {
      const { data } = await supabase.storage.from(bucket).download(`${prefix}/${file.name}`)
      if (!data) return null
      try { return JSON.parse(await data.text()) as FamilyMember } catch { return null }
    }))).filter((member): member is FamilyMember => Boolean(member))
    return { ...meta.room, members, updatedAt: members.reduce((latest, member) => member.updatedAt > latest ? member.updatedAt : latest, meta.room.updatedAt) }
  }

  try {
    if (request.method === 'POST') {
      const contentLength = Number(request.headers.get('content-length') ?? 0)
      if (contentLength > 262144) return json({ error: 'Payload too large' }, 413)
      const body = await request.json().catch(() => null) as { room?: unknown } | null
      if (!body || !validRoom(body.room)) return json({ error: 'Invalid room' }, 400)
      const room = body.room
      if (await readMeta(room.id)) return json({ error: 'Room already exists' }, 409)
      const key = makeSecret()
      const { members, ...roomWithoutMembers } = room
      const meta: StoredMeta = { keyHash: await sha256(key), room: roomWithoutMembers }
      const base = supabase.storage.from(bucket)
      const metaUpload = await base.upload(`rooms/${room.id}/meta.json`, JSON.stringify(meta), { contentType: 'application/json', upsert: false })
      if (metaUpload.error) return json({ error: 'Room could not be created' }, 500)
      const memberUpload = await base.upload(`rooms/${room.id}/members/${members[0].id}.json`, JSON.stringify(members[0]), { contentType: 'application/json', upsert: true })
      if (memberUpload.error) return json({ error: 'First family member could not be saved' }, 500)
      return json({ id: room.id, key }, 201)
    }

    if (request.method === 'GET') {
      const url = new URL(request.url)
      const id = url.searchParams.get('id') ?? ''
      const key = url.searchParams.get('key') ?? ''
      const meta = await authorizedMeta(id, key)
      if (!meta) return json({ error: 'Room not found' }, 404)
      return json({ room: await assemble(id, meta) })
    }

    if (request.method === 'DELETE') {
      const url = new URL(request.url)
      const id = url.searchParams.get('id') ?? ''
      const key = url.searchParams.get('key') ?? ''
      const meta = await authorizedMeta(id, key)
      if (!meta) return json({ error: 'Room not found' }, 404)
      const prefix = `rooms/${id}/members`
      const { data: files } = await supabase.storage.from(bucket).list(prefix, { limit: 100 })
      const paths = (files ?? []).map((file) => `${prefix}/${file.name}`)
      paths.push(`rooms/${id}/meta.json`)
      const removed = await supabase.storage.from(bucket).remove(paths)
      if (removed.error) return json({ error: 'Room could not be removed' }, 500)
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    const body = await request.json().catch(() => null) as { id?: string; key?: string; member?: unknown } | null
    if (!body || typeof body.id !== 'string' || typeof body.key !== 'string' || !validMember(body.member)) return json({ error: 'Invalid update' }, 400)
    const meta = await authorizedMeta(body.id, body.key)
    if (!meta) return json({ error: 'Room not found' }, 404)
    const member = { ...body.member, name: body.member.name.trim(), updatedAt: new Date().toISOString() }
    const upload = await supabase.storage.from(bucket).upload(`rooms/${body.id}/members/${member.id}.json`, JSON.stringify(member), { contentType: 'application/json', upsert: true })
    if (upload.error) return json({ error: 'Ranking could not be saved' }, 500)
    return json({ room: await assemble(body.id, meta) })
  } catch (error) {
    console.error(error)
    return json({ error: 'Unexpected room service error' }, 500)
  }
})
