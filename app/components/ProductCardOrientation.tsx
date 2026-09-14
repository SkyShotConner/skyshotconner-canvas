'use client'

import { useEffect } from 'react'

function applyOrientation(card: HTMLElement) {
  const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
  const wrap = card.querySelector<HTMLElement>('.product-image-wrap')
  if (!image || !wrap || !image.naturalWidth || !image.naturalHeight) return

  const ratio = image.naturalWidth / image.naturalHeight
  const orientation = ratio > 1.05 ? 'landscape' : ratio < 0.95 ? 'portrait' : 'square'

  card.dataset.orientation = orientation
  wrap.classList.remove('portrait', 'landscape', 'square')
  wrap.classList.add(orientation)
}

function scan() {
  document.querySelectorAll<HTMLElement>('.product-card').forEach(card => {
    const image = card.querySelector<HTMLImageElement>('.product-image-wrap img')
    if (!image) return
    if (image.complete) applyOrientation(card)
    else image.addEventListener('load', () => applyOrientation(card), { once: true })
  })
}

export default function ProductCardOrientation() {
  useEffect(() => {
    scan()
    const observer = new MutationObserver(scan)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
