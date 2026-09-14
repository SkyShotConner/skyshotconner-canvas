'use client'

import { useEffect } from 'react'

type Orientation = 'landscape' | 'portrait' | 'square'

function applyOrientation(card: HTMLElement) {
  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  const wrap = card.querySelector<HTMLElement>('.product-image-wrap')
  if (!image || !wrap || !image.naturalWidth || !image.naturalHeight) return false

  const ratio = image.naturalWidth / image.naturalHeight
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

function buildPattern(cards: HTMLElement[], landscapeCount: number, portraitCount: number) {
  const landscapes = cards.filter(card => card.dataset.orientation === 'landscape')
  const portraits = cards.filter(card => card.dataset.orientation === 'portrait')
  const squares = cards.filter(card => card.dataset.orientation === 'square')
  const arranged: HTMLElement[] = []

  let landscapeIndex = 0
  let portraitIndex = 0

  while (landscapeIndex < landscapes.length || portraitIndex < portraits.length) {
    for (let i = 0; i < landscapeCount && landscapeIndex < landscapes.length; i += 1) {
      arranged.push(landscapes[landscapeIndex++])
    }

    for (let i = 0; i < portraitCount && portraitIndex < portraits.length; i += 1) {
      arranged.push(portraits[portraitIndex++])
    }
  }

  arranged.push(...squares)
  return arranged
}

function arrangeGrid(grid: HTMLElement) {
  const cards = Array.from(grid.querySelectorAll<HTMLElement>(':scope > .product-card'))
  if (!cards.length) return

  const isMobile = window.matchMedia('(max-width: 800px)').matches
  const arranged = buildPattern(cards, isMobile ? 1 : 2, isMobile ? 2 : 3)

  arranged.forEach((card, index) => {
    card.style.setProperty('order', String(index + 1))
  })
}

function prepareCard(card: HTMLElement) {
  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  if (!image) return

  if (!applyOrientation(card)) {
    const onLoad = () => {
      applyOrientation(card)
      const grid = card.closest<HTMLElement>('.shop-grid')
      if (grid) arrangeGrid(grid)
    }
    image.addEventListener('load', onLoad, { once: true })
  }
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

    const timers = [100, 300, 700, 1500].map(ms => window.setTimeout(scan, ms))

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', onViewportChange)
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return null
}
