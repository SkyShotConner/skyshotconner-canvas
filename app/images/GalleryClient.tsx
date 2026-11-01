'use client'

import { useCallback, useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export type GalleryPhoto = {
  id: string
  src: string
  full: string
  alt: string
  width: number
  height: number
}

export default function GalleryClient({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = useState<number | null>(null)
  const close = useCallback(() => setActive(null), [])
  const previous = useCallback(() => setActive(i => i === null ? null : (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setActive(i => i === null ? null : (i + 1) % photos.length), [photos.length])

  useEffect(() => {
    if (active === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') previous()
      if (event.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [active, close, next, previous])

  if (!photos.length) {
    return <div className="images-empty" aria-label="Photography gallery"> </div>
  }

  return (
    <>
      <section className="images-masonry" aria-label="Photography gallery">
        {photos.map((photo, index) => (
          <button className="images-tile" key={photo.id} onClick={() => setActive(index)} aria-label={`Open photograph ${index + 1}`}>
            <img src={photo.src} alt={photo.alt} loading={index < 8 ? 'eager' : 'lazy'} width={photo.width} height={photo.height} />
          </button>
        ))}
      </section>
      {active !== null && photos[active] && (
        <div className="images-lightbox" role="dialog" aria-modal="true" aria-label="Photograph viewer" onClick={close}>
          <button className="images-close" onClick={close} aria-label="Close image"><X/></button>
          {photos.length > 1 && <button className="images-previous" onClick={event => { event.stopPropagation(); previous() }} aria-label="Previous image"><ChevronLeft/></button>}
          <img className="images-full" src={photos[active].full} alt={photos[active].alt} onClick={event => event.stopPropagation()} />
          {photos.length > 1 && <button className="images-next" onClick={event => { event.stopPropagation(); next() }} aria-label="Next image"><ChevronRight/></button>}
        </div>
      )}
    </>
  )
}
