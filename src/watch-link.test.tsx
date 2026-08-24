// @vitest-environment jsdom
/* Mandatory coverage: every ranked .pick-row must carry a large, dedicated
   "Watch this pick" link that opens the source video at the stored timestamp,
   safely in a new tab. Also covers the Discover card's watch link. */

import { cleanup, render } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { afterEach, describe, expect, it } from 'vitest'
import attractionData from './data/attractions.json'
import { TOP_LIMIT } from './ranking'
import { AttractionCard, SortablePick } from './App'
import type { Attraction } from './types'

const attractions = attractionData as Attraction[]
const VIDEO_ID = 'Ok72hT9iOpY'

afterEach(cleanup)

function renderPickList(items: Attraction[]) {
  return render(
    <DndContext>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="pick-list">
          {items.map((item, index) => (
            <SortablePick
              key={item.id}
              item={item}
              rank={index + 1}
              total={items.length}
              onMove={() => undefined}
              onRemove={() => undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>,
  )
}

describe('Top 33 watch links', () => {
  it('renders a dedicated watch link in every .pick-row of a full Top 33', () => {
    const top33 = attractions.slice(0, TOP_LIMIT)
    const { container } = renderPickList(top33)

    const rows = container.querySelectorAll('.pick-row')
    expect(rows.length).toBe(TOP_LIMIT)

    rows.forEach((row, index) => {
      const item = top33[index]
      const link = row.querySelector('a.pick-watch')
      expect(link, `row ${index + 1} (${item.name}) is missing its watch link`).not.toBeNull()
      expect(link!.getAttribute('href')).toBe(`https://www.youtube.com/watch?v=${VIDEO_ID}&t=${item.timestamp}s`)
      expect(link!.getAttribute('target')).toBe('_blank')
      expect(link!.getAttribute('rel')).toContain('noreferrer')
      expect(link!.textContent).toContain(`Watch this pick at ${item.timestampLabel}`)
      expect(link!.getAttribute('aria-label')).toContain(item.name)
    })
  })

  it('keeps the watch link separate from the drag and remove controls', () => {
    const { container } = renderPickList(attractions.slice(0, 3))
    container.querySelectorAll('.pick-row').forEach((row) => {
      const link = row.querySelector('a.pick-watch')!
      expect(link.closest('.pick-actions')).toBeNull()
      const actions = row.querySelector('.pick-actions')!
      expect(actions.querySelector('a.pick-watch')).toBeNull()
      expect(actions.querySelectorAll('button').length).toBe(4)
    })
  })

  it('shows thumbnail, name and park/area in every ranked row', () => {
    const sample = attractions.slice(40, 45)
    const { container } = renderPickList(sample)
    container.querySelectorAll('.pick-row').forEach((row, index) => {
      const item = sample[index]
      expect(row.querySelector('img')?.getAttribute('src')).toContain(item.image)
      expect(row.textContent).toContain(item.name)
      expect(row.textContent).toContain(item.park)
      expect(row.textContent).toContain(item.area)
    })
  })

  it('builds a correct timestamped watch URL for all 155 attractions', () => {
    for (const item of attractions) {
      expect(item.timestamp).toBeTypeOf('number')
      expect(item.timestamp).toBeGreaterThanOrEqual(0)
      expect(item.timestampLabel).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    }
    const last = attractions[attractions.length - 1]
    const { container } = renderPickList([last])
    expect(container.querySelector('a.pick-watch')!.getAttribute('href'))
      .toBe(`https://www.youtube.com/watch?v=${VIDEO_ID}&t=${last.timestamp}s`)
  })
})

describe('Discover card watch link', () => {
  it('links the card to the timestamped source video', () => {
    const item = attractions[10]
    const { container } = render(<AttractionCard item={item} onToggle={() => undefined} />)
    const link = container.querySelector('a.watch-link')
    expect(link).not.toBeNull()
    expect(link!.getAttribute('href')).toBe(`https://www.youtube.com/watch?v=${VIDEO_ID}&t=${item.timestamp}s`)
    expect(link!.getAttribute('target')).toBe('_blank')
    expect(link!.textContent).toContain(item.timestampLabel)
  })
})
