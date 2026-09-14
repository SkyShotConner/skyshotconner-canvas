'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Orientation = 'landscape' | 'portrait' | 'square'

const databaseOrientations = new Map<string, Orientation>()
let databaseLoaded = false
let arranging = false

function normalizeName(value?: string | null) {
  return String(value || '').trim().toLowerCase()
}

function styleCard(card: HTMLElement, orientation: Orientation, source: 'database' | 'image' = 'image') {
  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  const wrap = card.querySelector<HTMLElement>('.product-image-wrap')
  if (!image || !wrap) return false

  card.dataset.orientation = orientation
  card.dataset.orientationSource = source
  wrap.classList.remove('portrait', 'landscape', 'square')
  wrap.classList.add(orientation)

  wrap.style.setProperty(
    'aspect-ratio',
    orientation === 'portrait' ? '2 / 3' : orientation === 'landscape' ? '3 / 2' : '1 / 1',
    'important'
  )
  wrap.style.setProperty('width', '100%', 'important')
  wrap.style.setProperty('overflow', 'hidden', 'important')

  image.style.setProperty('width', '100%', 'important')
  image.style.setProperty('height', '100%', 'important')
  image.style.setProperty('object-fit', 'contain', 'important')
  image.style.setProperty('aspect-ratio', 'auto', 'important')

  return true
}

function applyDatabaseOrientation(card: HTMLElement) {
  const name = normalizeName(card.querySelector<HTMLElement>('.product-name')?.textContent)
  if (!name) return false
  const orientation = databaseOrientations.get(name)
  if (!orientation) return false
  return styleCard(card, orientation, 'database')
}

function setOrientationFromDimensions(card: HTMLElement, width: number, height: number) {
  if (!width || !height || card.dataset.orientationSource === 'database') return false
  const ratio = width / height
  const orientation: Orientation = ratio > 1.05 ? 'landscape' : ratio < 0.95 ? 'portrait' : 'square'
  return styleCard(card, orientation, 'image')
}

function prepareCard(card: HTMLElement) {
  if (applyDatabaseOrientation(card)) return

  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  if (!image) return

  if (image.naturalWidth && image.naturalHeight) {
    setOrientationFromDimensions(card, image.naturalWidth, image.naturalHeight)
    return
  }

  const probeKey = image.currentSrc || image.src
  if (!probeKey || card.dataset.orientationProbe === probeKey) return
  card.dataset.orientationProbe = probeKey

  const finish = (width: number, height: number) => {
    if (!setOrientationFromDimensions(card, width, height)) return
    const grid = card.closest<HTMLElement>('.shop-grid')
    if (grid) arrangeGrid(grid)
  }

  image.addEventListener('load', () => finish(image.naturalWidth, image.naturalHeight), { once: true })

  const probe = new Image()
  probe.onload = () => finish(probe.naturalWidth, probe.naturalHeight)
  probe.src = probeKey
}

function arrangeGrid(grid: HTMLElement) {
  if (arranging) return

  const cards = Array.from(grid.querySelectorAll<HTMLElement>(':scope > .product-card'))
  if (!cards.length) return

  const isMobile = window.matchMedia('(max-width: 800px)').matches
  const landscapes = cards.filter(card => card.dataset.orientation === 'landscape')
  const portraits = cards.filter(card => card.dataset.orientation === 'portrait')
  const squares = cards.filter(card => card.dataset.orientation === 'square')
  const unknown = cards.filter(card => !card.dataset.orientation)

  const landscapePerRow = isMobile ? 1 : 2
  const portraitPerRow = isMobile ? 2 : 3
  const ordered: HTMLElement[] = []

  let landscapeIndex = 0
  let portraitIndex = 0

  while (landscapeIndex < landscapes.length || portraitIndex < portraits.length) {
    for (let i = 0; i < landscapePerRow && landscapeIndex < landscapes.length; i += 1) {
      ordered.push(landscapes[landscapeIndex++])
    }
    for (let i = 0; i < portraitPerRow && portraitIndex < portraits.length; i += 1) {
      ordered.push(portraits[portraitIndex++])
    }
  }

  ordered.push(...squares, ...unknown)

  arranging = true
  try {
    // Reorder the actual DOM nodes. This prevents legacy nth-child rules from
    // preserving the previous product order.
    ordered.forEach(card => grid.appendChild(card))

    const reorderedCards = Array.from(grid.querySelectorAll<HTMLElement>(':scope > .product-card'))
    reorderedCards.forEach(card => {
      card.style.removeProperty('grid-row')
      card.style.removeProperty('grid-column')
      card.style.removeProperty('order')
    })

    grid.style.setProperty(
      'grid-template-columns',
      isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))',
      'important'
    )
    grid.style.setProperty('grid-auto-flow', 'row', 'important')

    let row = 1
    let li = 0
    let pi = 0

    while (li < landscapes.length || pi < portraits.length) {
      let placedLandscape = false
      for (let slot = 0; slot < landscapePerRow && li < landscapes.length; slot += 1) {
        const card = landscapes[li++]
        placedLandscape = true
        card.style.setProperty('grid-row', String(row), 'important')
        if (isMobile) {
          card.style.setProperty('grid-column', '1 / -1', 'important')
        } else {
          const start = slot === 0 ? 1 : 4
          card.style.setProperty('grid-column', `${start} / span 3`, 'important')
        }
      }
      if (placedLandscape) row += 1

      let placedPortrait = false
      for (let slot = 0; slot < portraitPerRow && pi < portraits.length; slot += 1) {
        const card = portraits[pi++]
        placedPortrait = true
        card.style.setProperty('grid-row', String(row), 'important')
        if (isMobile) {
          card.style.setProperty('grid-column', `${slot + 1} / span 1`, 'important')
        } else {
          card.style.setProperty('grid-column', `${1 + slot * 2} / span 2`, 'important')
        }
      }
      if (placedPortrait) row += 1
    }

    let overflowColumn = 0
    ;[...squares, ...unknown].forEach(card => {
      const columnsPerRow = isMobile ? 2 : 3
      if (overflowColumn >= columnsPerRow) {
        overflowColumn = 0
        row += 1
      }
      card.style.setProperty('grid-row', String(row), 'important')
      card.style.setProperty(
        'grid-column',
        isMobile ? `${overflowColumn + 1} / span 1` : `${1 + overflowColumn * 2} / span 2`,
        'important'
      )
      overflowColumn += 1
    })

    grid.dataset.orientationLayout = 'active'
  } finally {
    arranging = false
  }
}

function scan() {
  if (arranging) return
  document.querySelectorAll<HTMLElement>('.product-card').forEach(prepareCard)
  document.querySelectorAll<HTMLElement>('.shop-grid').forEach(arrangeGrid)
}

async function loadDatabaseOrientations() {
  if (databaseLoaded) return
  const supabase = createClient()
  if (!supabase) return

  const { data } = await supabase
    .from('products')
    .select('name,orientation')
    .eq('is_active', true)

  if (!data?.length) return

  databaseOrientations.clear()
  data.forEach((product: any) => {
    if (product.orientation !== 'landscape' && product.orientation !== 'portrait') return
    databaseOrientations.set(normalizeName(product.name), product.orientation)
  })
  databaseLoaded = true

  document.querySelectorAll<HTMLElement>('.product-card').forEach(applyDatabaseOrientation)
  document.querySelectorAll<HTMLElement>('.shop-grid').forEach(arrangeGrid)
}

export default function ProductCardOrientation() {
  useEffect(() => {
    scan()
    loadDatabaseOrientations()

    let frame = 0
    const observer = new MutationObserver(() => {
      if (arranging) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        scan()
        loadDatabaseOrientations()
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const mediaQuery = window.matchMedia('(max-width: 800px)')
    const onViewportChange = () => requestAnimationFrame(scan)
    mediaQuery.addEventListener('change', onViewportChange)

    const timers = [100, 300, 700, 1500, 3000].map(ms => window.setTimeout(() => {
      scan()
      loadDatabaseOrientations()
    }, ms))

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      mediaQuery.removeEventListener('change', onViewportChange)
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return null
}
