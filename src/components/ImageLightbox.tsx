import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ImageLightboxProps {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
  alt?: string
}

export function ImageLightbox({ imageUrl, isOpen, onClose, alt = 'Node image' }: ImageLightboxProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Close image preview"
      >
        <X size={24} />
      </button>
      <img
        src={imageUrl}
        alt={alt}
        className="max-h-[80vh] max-w-[80vw] object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body
  )
}
