'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Orientation = 'landscape' | 'portrait' | 'square'

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

function setOrientationFromDimensions(card: HTMLElement, width: number, height: number) {
  if (!width || !height || card.dataset.orientationSource === 'database') return false

  const ratio = width / height
  const orientation: Orientation = ratio > 1.05 ? 'landscape' : ratio < 0.95 ? 'portrait' : 'square'
  return styleCard(card, orientation, 'image')
}

function applyImageOrientation(card: HTMLElement) {
  if (card.dataset.orientationSource === 'database') return true
  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  if (!image || !image.naturalWidth || !image.naturalHeight) return false
  return setOrientationFromDimensions(card, image.naturalWidth, image.naturalHeight)
}

function arrangeGrid(grid: HTMLElement) {
  const cards = Array.from(grid.querySelectorAll<HTMLElement>(':scope > .product-card'))
  if (!cards.length) return

  const isMobile = window.matchMedia('(max-width: 800px)').matches
  const landscapes = cards.filter(card => card.dataset.orientation === 'landscape')
  const portraits = cards.filter(card => card.dataset.orientation === 'portrait')
  const squares = cards.filter(card => card.dataset.orientation === 'square')
  const unknown = cards.filter(card => !card.dataset.orientation)

  cards.forEach(card => {
    card.style.removeProperty('grid-row')
    card.style.removeProperty('grid-column')
    card.style.removeProperty('order')
  })

  const landscapePerRow = isMobile ? 1 : 2
  const portraitPerRow = isMobile ? 2 : 3
  const landscapeRows = Math.ceil(landscapes.length / landscapePerRow)
  const portraitRows = Math.ceil(portraits.length / portraitPerRow)
  const cycles = Math.max(landscapeRows, portraitRows)

  let landscapeIndex = 0
  let portraitIndex = 0
  let row = 1
  let order = 1

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    let placedLandscape = false
    for (let slot = 0; slot < landscapePerRow; slot += 1) {
      const card = landscapes[landscapeIndex++]
      if (!card) continue

      placedLandscape = true
      card.style.setProperty('grid-row', String(row), 'important')
      if (isMobile) {
        card.style.setProperty('grid-column', '1 / -1', 'important')
      } else {
        const start = slot === 0 ? 1 : 4
        card.style.setProperty('grid-column', `${start} / span 3`, 'important')
      }
      card.style.setProperty('order', String(order++), 'important')
    }
    if (placedLandscape) row += 1

    let placedPortrait = false
    for (let slot = 0; slot < portraitPerRow; slot += 1) {
      const card = portraits[portraitIndex++]
      if (!card) continue

      placedPortrait = true
      card.style.setProperty('grid-row', String(row), 'important')
      if (isMobile) {
        const start = slot + 1
        card.style.setProperty('grid-column', `${start} / span 1`, 'important')
      } else {
        const start = 1 + slot * 2
        card.style.setProperty('grid-column', `${start} / span 2`, 'important')
      }
      card.style.setProperty('order', String(order++), 'important')
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
    if (isMobile) {
      card.style.setProperty('grid-column', `${overflowColumn + 1} / span 1`, 'important')
    } else {
      card.style.setProperty('grid-column', `${1 + overflowColumn * 2} / span 2`, 'important')
    }
    card.style.setProperty('order', String(order++), 'important')
    overflowColumn += 1
  })
}

function prepareCard(card: HTMLElement) {
  if (card.dataset.orientationSource === 'database') return

  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  if (!image) return

  if (applyImageOrientation(card)) return

  if (card.dataset.orientationProbe === image.currentSrc + image.src) return
  card.dataset.orientationProbe = image.currentSrc + image.src

  const finish = (width: number, height: number) => {
    if (!setOrientationFromDimensions(card, width, height)) return
    const grid = card.closest<HTMLElement>('.shop-grid')
    if (grid) arrangeGrid(grid)
  }

  image.addEventListener('load', () => finish(image.naturalWidth, image.naturalHeight), { once: true })

  const probe = new Image()
  probe.onload = () => finish(probe.naturalWidth, probe.naturalHeight)
  probe.src = image.currentSrc || image.src
}

function scan() {
  document.querySelectorAll<HTMLElement>('.product-card').forEach(prepareCard)
  document.querySelectorAll<HTMLElement>('.shop-grid').forEach(arrangeGrid)
}

async function applyDatabaseOrientations() {
  const supabase = createClient()
  if (!supabase) return

  const { data } = await supabase
    .from('products')
    .select('name,orientation')
    .eq('is_active', true)

  if (!data?.length) return

  const orientations = new Map<string, Orientation>()
  data.forEach((product: any) => {
    if (product.orientation !== 'landscape' && product.orientation !== 'portrait') return
    orientations.set(String(product.name || '').trim().toLowerCase(), product.orientation)
  })

  document.querySelectorAll<HTMLElement>('.product-card').forEach(card => {
    const name = card.querySelector<HTMLElement>('.product-name')?.textContent?.trim().toLowerCase()
    if (!name) return

    const orientation = orientations.get(name)
    if (orientation) styleCard(card, orientation, 'database')
  })

  document.querySelectorAll<HTMLElement>('.shop-grid').forEach(arrangeGrid)
}

export default function ProductCardOrientation() {
  useEffect(() => {
    scan()
    applyDatabaseOrientations()

    const observer = new MutationObserver(() => {
      requestAnimationFrame(() => {
        scan()
        applyDatabaseOrientations()
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const mediaQuery = window.matchMedia('(max-width: 800px)')
    const onViewportChange = () => requestAnimationFrame(scan)
    mediaQuery.addEventListener('change', onViewportChange)

    const timers = [100, 300, 700, 1500, 3000].map(ms => window.setTimeout(() => {
      scan()
      applyDatabaseOrientations()
    }, ms))

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', onViewportChange)
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return null
}
