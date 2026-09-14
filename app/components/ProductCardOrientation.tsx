'use client'

import { useEffect } from 'react'

function applyOrientation(card: HTMLElement) {
  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  const wrap = card.querySelector<HTMLElement>('.product-image-wrap')
  if (!image || !wrap || !image.naturalWidth || !image.naturalHeight) return false

  const ratio = image.naturalWidth / image.naturalHeight
  const orientation = ratio > 1.05 ? 'landscape' : ratio < 0.95 ? 'portrait' : 'square'

  card.dataset.orientation = orientation
  wrap.classList.remove('portrait', 'landscape', 'square')
  wrap.classList.add(orientation)

  // Apply the presentation directly so later stylesheet rules cannot force
  // every artwork into the same shape.
  wrap.style.setProperty('aspect-ratio', orientation === 'portrait' ? '2 / 3' : orientation === 'landscape' ? '3 / 2' : '1 / 1', 'important')
  wrap.style.setProperty('width', '100%', 'important')
  wrap.style.setProperty('overflow', 'hidden', 'important')

  image.style.setProperty('width', '100%', 'important')
  image.style.setProperty('height', '100%', 'important')
  image.style.setProperty('object-fit', 'contain', 'important')
  image.style.setProperty('aspect-ratio', 'auto', 'important')

  // Portrait artworks first, then landscape artworks, then square artwork.
  if (card.closest('.shop-grid')) {
    card.style.setProperty('order', orientation === 'portrait' ? '1' : orientation === 'landscape' ? '2' : '3')
  }

  return true
}

function prepareCard(card: HTMLElement) {
  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  if (!image) return

  if (!applyOrientation(card)) {
    const onLoad = () => applyOrientation(card)
    image.addEventListener('load', onLoad, { once: true })
  }
}

function scan() {
  document.querySelectorAll<HTMLElement>('.product-card').forEach(prepareCard)
}

export default function ProductCardOrientation() {
  useEffect(() => {
    scan()

    // React/Supabase can replace the demo cards after the first paint, so
    // keep rescanning when those product nodes change.
    const observer = new MutationObserver(() => requestAnimationFrame(scan))
    observer.observe(document.body, { childList: true, subtree: true })

    // A short retry window also covers lazy-loaded images that have not yet
    // exposed naturalWidth/naturalHeight when the first scan happens.
    const timers = [100, 300, 700, 1500].map(ms => window.setTimeout(scan, ms))

    return () => {
      observer.disconnect()
      timers.forEach(window.clearTimeout)
    }
  }, [])

  return null
}
