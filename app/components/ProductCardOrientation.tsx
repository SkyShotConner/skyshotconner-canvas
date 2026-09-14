'use client'

import { useEffect } from 'react'

type Orientation = 'landscape' | 'portrait' | 'square'

function setOrientation(card: HTMLElement, width: number, height: number) {
  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  const wrap = card.querySelector<HTMLElement>('.product-image-wrap')
  if (!image || !wrap || !width || !height) return false

  const ratio = width / height
  const orientation: Orientation = ratio > 1.05 ? 'landscape' : ratio < 0.95 ? 'portrait' : 'square'

  card.dataset.orientation = orientation
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

function applyOrientation(card: HTMLElement) {
  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  if (!image || !image.naturalWidth || !image.naturalHeight) return false
  return setOrientation(card, image.naturalWidth, image.naturalHeight)
}

function arrangeGrid(grid: HTMLElement) {
  const cards = Array.from(grid.querySelectorAll<HTMLElement>(':scope > .product-card'))
  if (!cards.length) return

  const isMobile = window.matchMedia('(max-width: 800px)').matches
  const landscapes = cards.filter(card => card.dataset.orientation === 'landscape')
  const portraits = cards.filter(card => card.dataset.orientation === 'portrait')
  const squares = cards.filter(card => card.dataset.orientation === 'square')
  const unknown = cards.filter(card => !card.dataset.orientation)

  // Reset explicit placement before rebuilding the pattern.
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
    // Landscape row. Missing matching products intentionally leave blank slots.
    for (let slot = 0; slot < landscapePerRow; slot += 1) {
      const card = landscapes[landscapeIndex++]
      if (!card) continue

      card.style.setProperty('grid-row', String(row), 'important')
      if (isMobile) {
        card.style.setProperty('grid-column', '1 / -1', 'important')
      } else {
        const start = slot === 0 ? 1 : 4
        card.style.setProperty('grid-column', `${start} / span 3`, 'important')
      }
      card.style.setProperty('order', String(order++), 'important')
    }
    row += 1

    // Portrait row. Missing matching products intentionally leave blank slots.
    for (let slot = 0; slot < portraitPerRow; slot += 1) {
      const card = portraits[portraitIndex++]
      if (!card) continue

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
    row += 1
  }

  // Square and still-undetected cards are kept after the reserved pattern.
  ;[...squares, ...unknown].forEach(card => {
    card.style.setProperty('grid-row', String(row), 'important')
    card.style.setProperty('grid-column', isMobile ? 'span 1' : 'span 2', 'important')
    card.style.setProperty('order', String(order++), 'important')
  })
}

function prepareCard(card: HTMLElement) {
  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  if (!image) return

  if (applyOrientation(card)) return

  if (card.dataset.orientationProbe === image.currentSrc + image.src) return
  card.dataset.orientationProbe = image.currentSrc + image.src

  const finish = (width: number, height: number) => {
    if (!setOrientation(card, width, height)) return
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

export default function ProductCardOrientation() {
  useEffect(() => {
    scan()

    const observer = new MutationObserver(() => requestAnimationFrame(scan))
    observer.observe(document.body, { childList: true, subtree: true })

    const mediaQuery = window.matchMedia('(max-width: 800px)')
    const onViewportChange = () => requestAnimationFrame(scan)
    mediaQuery.addEventListener('change', onViewportChange)

    const timers = [100, 300, 700, 1500, 3000].map(ms => window.setTimeout(scan, ms))

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', onViewportChange)
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return null
}
