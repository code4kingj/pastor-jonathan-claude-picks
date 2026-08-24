import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Check,
  Clock3,
  Crown,
  ExternalLink,
  GripVertical,
  Heart,
  Link2,
  ListFilter,
  Minus,
  PartyPopper,
  Play,
  Search,
  Sparkles,
  Users,
  WandSparkles,
  X,
} from 'lucide-react'
import attractionData from './data/attractions.json'
import { addToRanking, aggregateRankings, moveItem, TOP_LIMIT } from './ranking'
import {
  createRoom,
  isSharedModeAvailable,
  loadRoom,
  parseRoomLink,
  saveMember,
  setRoomLink,
  type RoomCredentials,
} from './roomApi'
import type { Attraction, FamilyMember, FamilyRoom, Park } from './types'
import { EarMark, ProgressEars, RankMedallion } from './components/EarMark'
import { NightSky } from './components/NightSky'
import { ThemeDial } from './components/ThemeDial'
import './App.css'
import './themes.css'

const attractions = attractionData as Attraction[]
const attractionById = new Map(attractions.map((item) => [item.id, item]))
const parks: Array<'All parks' | Park> = [
  'All parks',
  'Magic Kingdom',
  'Animal Kingdom',
  'EPCOT',
  'Hollywood Studios',
]
const categories = ['All types', 'Ride', 'Show', 'Character', 'Walkthrough', 'Animals', 'Transportation', 'Experience']
const parkClass: Record<Park, string> = {
  'Magic Kingdom': 'magic',
  'Animal Kingdom': 'animal',
  EPCOT: 'epcot',
  'Hollywood Studios': 'studios',
}

function imageUrl(item: Attraction) {
  return `${import.meta.env.BASE_URL}${item.image}`
}

function makeMember(name: string): FamilyMember {
  return { id: crypto.randomUUID(), name: name.trim(), rankings: [], updatedAt: new Date().toISOString() }
}

function memberStorageKey(roomId: string) {
  return `pastor-jonathan-member:${roomId}`
}

function mergeLocalMember(room: FamilyRoom | null, member: FamilyMember | null): FamilyMember[] {
  if (!room) return member ? [member] : []
  if (!member) return room.members
  return room.members.some((item) => item.id === member.id)
    ? room.members.map((item) => (item.id === member.id ? member : item))
    : [...room.members, member]
}

/* decorative drifting ears used on the gate and the hero */
function FloatField() {
  return (
    <div className="float-field" aria-hidden="true">
      <span className="float-ear"><EarMark size={54} /></span>
      <span className="float-ear"><EarMark size={34} /></span>
      <span className="float-ear"><EarMark size={44} /></span>
      <span className="float-ear"><EarMark size={28} /></span>
    </div>
  )
}

export function SortablePick({
  item,
  rank,
  total,
  onMove,
  onRemove,
}: {
  item: Attraction
  rank: number
  total: number
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <article
      ref={setNodeRef}
      className={`pick-row ${parkClass[item.park]} ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <RankMedallion rank={rank} size={46} />
      <img src={imageUrl(item)} alt="" />
      <div className="pick-copy">
        <strong>{item.name}</strong>
        <span>{item.park} · {item.area}</span>
      </div>
      <a
        className="pick-watch"
        href={`https://www.youtube.com/watch?v=Ok72hT9iOpY&t=${item.timestamp}s`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Watch ${item.name} in the source video at ${item.timestampLabel}`}
      >
        <Play size={16} fill="currentColor" /> Watch this pick at {item.timestampLabel} <ExternalLink size={13} />
      </a>
      <div className="pick-actions">
        <button className="icon-button drag-handle" aria-label={`Drag ${item.name}`} {...attributes} {...listeners}>
          <GripVertical size={19} />
        </button>
        <button className="icon-button" aria-label={`Move ${item.name} up`} disabled={rank === 1} onClick={() => onMove(-1)}>
          <ArrowUp size={18} />
        </button>
        <button className="icon-button" aria-label={`Move ${item.name} down`} disabled={rank === total} onClick={() => onMove(1)}>
          <ArrowDown size={18} />
        </button>
        <button className="icon-button remove" aria-label={`Remove ${item.name}`} onClick={onRemove}>
          <X size={18} />
        </button>
      </div>
    </article>
  )
}

export function AttractionCard({ item, rank, onToggle }: { item: Attraction; rank?: number; onToggle: () => void }) {
  return (
    <article className={`attraction-card ${parkClass[item.park]} ${rank ? 'selected' : ''}`}>
      <div className="card-image">
        <img src={imageUrl(item)} alt={`Video view of ${item.name}`} loading="lazy" />
        <div className="image-scrim" />
        <span className="video-order">#{item.order} in video</span>
        {rank && <span className="selected-rank"><RankMedallion rank={rank} size={42} /></span>}
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className="park-pill">{item.park}</span>
          <span>{item.category}</span>
        </div>
        <h3>{item.name}</h3>
        <p className="area">{item.area}</p>
        <p className="description">{item.description}</p>
        {item.availability !== 'Open' && (
          <span className={`availability ${item.availability.toLowerCase().replace(' ', '-')}`} title={item.availabilityNote}>
            {item.availability}
          </span>
        )}
        <div className="card-actions">
          <a
            href={`https://www.youtube.com/watch?v=Ok72hT9iOpY&t=${item.timestamp}s`}
            target="_blank"
            rel="noreferrer"
            className="watch-link"
            aria-label={`Watch ${item.name} at ${item.timestampLabel}`}
          >
            <Play size={16} fill="currentColor" /> {item.timestampLabel}
          </a>
          <button className={rank ? 'remove-pick' : 'add-pick'} onClick={onToggle}>
            {rank ? <><Minus size={17} /> Remove</> : <><Heart size={17} /> Add to Top 33</>}
          </button>
        </div>
      </div>
    </article>
  )
}

function App() {
  const [credentials, setCredentials] = useState<RoomCredentials | null>(() => parseRoomLink())
  const [room, setRoom] = useState<FamilyRoom | null>(null)
  const [member, setMember] = useState<FamilyMember | null>(null)
  const [name, setName] = useState('')
  const [view, setView] = useState<'discover' | 'rank' | 'results'>('discover')
  const [search, setSearch] = useState('')
  const [park, setPark] = useState<(typeof parks)[number]>('All parks')
  const [category, setCategory] = useState('All types')
  const [loading, setLoading] = useState(Boolean(credentials))
  const [error, setError] = useState('')
  const [syncState, setSyncState] = useState<'saved' | 'saving' | 'error'>('saved')
  const [copied, setCopied] = useState(false)
  const roomRef = useRef<FamilyRoom | null>(null)
  const isTestRoom = room?.title.includes('Test Room') ?? false

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (!credentials) return
    let active = true
    loadRoom(credentials)
      .then((loaded) => {
        if (!active) return
        setRoom(loaded)
        const savedMemberId = localStorage.getItem(memberStorageKey(credentials.id))
        const savedMember = loaded.members.find((item) => item.id === savedMemberId)
        if (savedMember) setMember((current) => current ?? savedMember)
      })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [credentials])

  useEffect(() => {
    if (!credentials || !member || !roomRef.current) return
    const timer = window.setTimeout(() => {
      saveMember(credentials, roomRef.current as FamilyRoom, { ...member, updatedAt: new Date().toISOString() })
        .then((updated) => {
          setRoom(updated)
          setSyncState('saved')
        })
        .catch(() => setSyncState('error'))
    }, 650)
    return () => window.clearTimeout(timer)
  }, [member, credentials])

  useEffect(() => {
    roomRef.current = room
  }, [room])

  useEffect(() => {
    if (!credentials || credentials.key === 'local') return
    const timer = window.setInterval(() => {
      loadRoom(credentials).then(setRoom).catch(() => undefined)
    }, 12000)
    return () => window.clearInterval(timer)
  }, [credentials])

  const ranking = member?.rankings ?? []
  const selected = new Map(ranking.map((id, index) => [id, index + 1]))
  const rankedAttractions = ranking.map((id) => attractionById.get(id)).filter(Boolean) as Attraction[]
  const members = mergeLocalMember(room, member)
  const results = aggregateRankings(attractions, members)
  const filtered = attractions.filter((item) => {
    const haystack = `${item.name} ${item.description} ${item.area}`.toLowerCase()
    return (
      (!search || haystack.includes(search.toLowerCase())) &&
      (park === 'All parks' || item.park === park) &&
      (category === 'All types' || item.category === category)
    )
  })

  async function startRoom() {
    if (!name.trim()) return
    setError('')
    const firstMember = makeMember(name)
    const now = new Date().toISOString()
    const draft: FamilyRoom = {
      version: 1,
      id: crypto.randomUUID(),
      title: "Pastor Jonathan's Birthday Picks",
      videoId: 'Ok72hT9iOpY',
      members: [firstMember],
      createdAt: now,
      updatedAt: now,
    }
    try {
      setLoading(true)
      const created = await createRoom(draft)
      localStorage.setItem(memberStorageKey(created.id), firstMember.id)
      setCredentials(created)
      setRoom(draft)
      setMember(firstMember)
      setRoomLink(created)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The room could not be created.')
    } finally {
      setLoading(false)
    }
  }

  function joinRoom() {
    if (!name.trim() || !room) return
    const joined = makeMember(name)
    if (credentials) localStorage.setItem(memberStorageKey(credentials.id), joined.id)
    setMember(joined)
  }

  function updateRanking(next: string[]) {
    setSyncState('saving')
    setMember((current) => current ? { ...current, rankings: next.slice(0, TOP_LIMIT) } : current)
  }

  function togglePick(id: string) {
    if (selected.has(id)) updateRanking(ranking.filter((item) => item !== id))
    else {
      const next = addToRanking(ranking, id)
      updateRanking(next)
      if (next.length === TOP_LIMIT) setView('rank')
    }
  }

  function dragEnded(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    updateRanking(moveItem(ranking, ranking.indexOf(String(active.id)), ranking.indexOf(String(over.id))))
  }

  async function shareRoom() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (loading) {
    return (
      <main className="gate">
        <NightSky />
        <div className="gate-loader">
          <EarMark className="gate-ears" />
          <h1>Opening the birthday room…</h1>
        </div>
        <ThemeDial />
      </main>
    )
  }

  if (!room || !member) {
    const joining = Boolean(room && credentials)
    return (
      <main className="gate">
        <NightSky />
        <FloatField />
        <section className="gate-card">
          <EarMark className="gate-ears" />
          {isTestRoom && <div className="test-room-gate"><b>TEST ROOM</b><span>Practice here—nothing you choose affects the real family results.</span></div>}
          <p className="eyebrow">A family adventure for</p>
          <h1>Pastor Jonathan’s<br /><span>Birthday Picks</span></h1>
          <p className="gate-intro">
            Watch all four Walt Disney World parks, build your personal Top 33, and reveal the family’s must-do list together.
          </p>
          <div className="source-stats">
            <span><Play size={16} /> 1:04:11 video</span>
            <span><Sparkles size={16} /> 155 experiences</span>
            <span><Users size={16} /> One family result</span>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); if (joining) joinRoom(); else startRoom() }}>
            <label htmlFor="name">What should the family call you?</label>
            <div className="name-row">
              <input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your first name" maxLength={32} />
              <button type="submit" className="shimmer" disabled={!name.trim()}>{joining ? 'Join the room' : 'Start our room'} <Sparkles size={18} /></button>
            </div>
          </form>
          {error && <p className="error-message">{error}</p>}
          {!isSharedModeAvailable && <p className="demo-note">Local preview mode is active until shared storage is connected.</p>}
          <p className="unofficial">A private family planner inspired by the magic of the parks. Not affiliated with or endorsed by Disney.</p>
        </section>
        <ThemeDial />
      </main>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#top" className="brand"><span className="brand-ears"><EarMark size={26} /></span><span>Pastor Jonathan’s <b>Birthday Picks</b></span></a>
        <nav aria-label="Main views">
          <button className={view === 'discover' ? 'active' : ''} onClick={() => setView('discover')}><Search size={17} /> Discover</button>
          <button className={view === 'rank' ? 'active' : ''} onClick={() => setView('rank')}><Heart size={17} /> My Top 33 <span className="count">{ranking.length}</span></button>
          <button className={view === 'results' ? 'active' : ''} onClick={() => setView('results')}><BarChart3 size={17} /> Family Results</button>
        </nav>
        <button className="share-button shimmer" onClick={shareRoom}>{copied ? <Check size={17} /> : <Link2 size={17} />}{copied ? 'Copied!' : 'Invite family'}</button>
      </header>
      {isTestRoom && <div className="test-room-banner" role="status"><strong>TEST ROOM</strong><span>Practice only—these choices do not affect Pastor Jonathan’s real family results.</span></div>}
      {isTestRoom && <div className="test-watermark" aria-hidden="true">TEST ROOM</div>}

      {view === 'discover' && (
        <main id="top">
          <section className="hero-banner">
            <FloatField />
            <div className="hero-copy">
              <p className="eyebrow"><Sparkles size={15} /> Watch · Pick · Celebrate</p>
              <h1>Which adventures make your <em>Top 33?</em></h1>
              <p>Follow the video in order, tap what makes you smile, then arrange your favorites. Every choice helps shape the family plan.</p>
              <div className="hero-actions">
                <a href="https://www.youtube.com/watch?v=Ok72hT9iOpY" target="_blank" rel="noreferrer" className="primary-link"><Play size={18} fill="currentColor" /> Watch the video <ExternalLink size={14} /></a>
                <button onClick={() => setView('rank')}><Heart size={18} /> Arrange my picks</button>
              </div>
            </div>
            <div className="hero-collage" aria-hidden="true">
              {[attractions[7], attractions[57], attractions[106], attractions[149]].map((item) => <img key={item.id} src={imageUrl(item)} alt="" />)}
              <div className="hero-medallion"><ProgressEars value={ranking.length} max={TOP_LIMIT} size={104} /><small>{ranking.length} of 33 picked</small></div>
            </div>
          </section>

          <section className="progress-strip" aria-label="Your progress">
            <div className="progress-identity"><span className="avatar">{member.name.slice(0, 1).toUpperCase()}</span><p><b>{member.name}’s adventure list</b><small>{syncState === 'saved' ? 'Saved to the family room' : syncState === 'saving' ? 'Saving your picks…' : 'Could not sync'}</small></p></div>
            <div className="progress-track"><span style={{ width: `${(ranking.length / TOP_LIMIT) * 100}%` }} /></div>
            <strong>{ranking.length} / {TOP_LIMIT}</strong>
          </section>

          <section className="catalog-section">
            <div className="section-heading">
              <div><p className="eyebrow">In video order</p><h2>All 155 experiences</h2><p>Every ride, show, character, trail, and named experience presented in the compilation.</p></div>
              <span className="showing">Showing {filtered.length}</span>
            </div>
            <div className="filters">
              <label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rides, characters, lands…" /></label>
              <div className="filter-scroll"><ListFilter size={17} />{parks.map((item) => <button key={item} className={park === item ? 'active' : ''} onClick={() => setPark(item)}>{item}</button>)}</div>
              <select aria-label="Experience type" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
            </div>
            <div className="attraction-grid">
              {filtered.map((item) => <AttractionCard key={item.id} item={item} rank={selected.get(item.id)} onToggle={() => togglePick(item.id)} />)}
            </div>
          </section>
        </main>
      )}

      {view === 'rank' && (
        <main className="rank-page">
          <section className="page-intro">
            <p className="eyebrow"><Heart size={15} /> Your personal itinerary</p>
            <h1>Arrange your Top 33</h1>
            <p>Drag the handle or use the arrow buttons. Number one earns 33 points, number 33 earns 1 point.</p>
          </section>
          <div className="rank-layout">
            <section className="ranking-panel">
              <div className="panel-title"><div><h2>{member.name}’s list</h2><p>{ranking.length === TOP_LIMIT ? 'Complete and ready for the family reveal!' : `Choose ${TOP_LIMIT - ranking.length} more to complete your list.`}</p></div><strong>{ranking.length}/{TOP_LIMIT}</strong></div>
              {rankedAttractions.length ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnded}>
                  <SortableContext items={ranking} strategy={verticalListSortingStrategy}>
                    <div className="pick-list">{rankedAttractions.map((item, index) => <SortablePick key={item.id} item={item} rank={index + 1} total={ranking.length} onMove={(direction) => updateRanking(moveItem(ranking, index, index + direction))} onRemove={() => togglePick(item.id)} />)}</div>
                  </SortableContext>
                </DndContext>
              ) : <div className="empty-state"><EarMark className="gate-ears" /><h3>Your list is waiting for some magic.</h3><button onClick={() => setView('discover')}>Browse all experiences</button></div>}
            </section>
            <aside className="rank-aside">
              <div className="aside-card gold"><Crown size={27} /><h3>How family scoring works</h3><p>Your #1 receives 33 points. Each following rank receives one fewer. Shared favorites naturally rise to the top.</p></div>
              <div className="aside-card"><Users size={25} /><h3>{members.length} family {members.length === 1 ? 'member' : 'members'} joined</h3><div className="member-chips">{members.map((item) => <span key={item.id}>{item.name} <small>{item.rankings.length}/33</small></span>)}</div></div>
              <button className="results-cta shimmer" onClick={() => setView('results')}><BarChart3 size={19} /> See family results</button>
            </aside>
          </div>
        </main>
      )}

      {view === 'results' && (
        <main className="results-page">
          <section className="results-hero">
            <NightSky />
            <div className="confetti-field" aria-hidden="true">
              <span className="confetti-ear"><EarMark size={22} /></span>
              <span className="confetti-ear"><EarMark size={16} /></span>
              <span className="confetti-ear"><EarMark size={26} /></span>
              <span className="confetti-ear"><EarMark size={18} /></span>
              <span className="confetti-ear"><EarMark size={20} /></span>
            </div>
            <p className="eyebrow"><PartyPopper size={16} /> The family reveal</p>
            <h1>Our Birthday Adventure</h1>
            <p>Combined from {members.length} {members.length === 1 ? 'wishlist' : 'wishlists'} · updates automatically as family members finish.</p>
          </section>
          {results.length ? (
            <section className="leaderboard">
              <div className="leaderboard-head"><span>Rank</span><span>Experience</span><span>Family love</span><span>Points</span></div>
              {results.map((result, index) => {
                const item = attractionById.get(result.attractionId)
                if (!item) return null
                return <article key={item.id} className={`result-row ${index < 3 ? 'podium' : ''}`}>
                  <div className="result-rank">{index < 3 ? <Crown size={19} fill="currentColor" /> : null}<b>{index + 1}</b></div>
                  <div className="result-attraction"><img src={imageUrl(item)} alt="" /><div><strong>{item.name}</strong><span>{item.park} · {item.area}</span></div></div>
                  <div className="family-love"><span><Users size={16} /> {result.voters}/{members.length} picked it</span><span><Crown size={15} /> {result.firstPlaceVotes} first-place</span><span><Clock3 size={15} /> avg #{result.averageRank.toFixed(1)}</span></div>
                  <div className="points"><b>{result.points}</b><small>points</small></div>
                </article>
              })}
            </section>
          ) : <section className="empty-results"><BarChart3 size={42} /><h2>The results appear after the first picks.</h2><button onClick={() => setView('discover')}>Start choosing</button></section>}
          <div className="results-note"><WandSparkles size={22} /><p><b>Transparent tie-break:</b> total rank points, then number of family wishlists, first-place votes, average rank, and finally video order.</p></div>
        </main>
      )}

      <footer><span><EarMark size={16} color="var(--red)" /> Made with love for Pastor Jonathan’s birthday</span><span>Unofficial private family planner · Attraction frames come from the supplied source video.</span></footer>
      <ThemeDial />
    </div>
  )
}

export default App
