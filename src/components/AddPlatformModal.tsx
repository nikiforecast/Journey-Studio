import React, { useState, useRef, useEffect } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from './DesignSystem/components/Button'
import { Modal } from './DesignSystem/components/Modal'
import { createPlatform, updatePlatform } from '../lib/database/services/platformService'
import type { Platform } from '../lib/supabase'

interface AddPlatformModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (platform: Platform) => void
  initialName?: string
  editingPlatform?: Platform | null // If provided, modal is in edit mode
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

const colorOptions = [
  '#3B82F6', // Blue
  '#00AA72', // Emerald
  '#E18E00', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#04ABC8', // Cyan
  '#67A812', // Lime
  '#D75800', // Orange
  '#E22D87', // Pink
]

export function AddPlatformModal({
  isOpen,
  onClose,
  onSuccess,
  initialName = '',
  editingPlatform = null
}: AddPlatformModalProps) {
  const isEditing = !!editingPlatform
  const [formData, setFormData] = useState({ name: initialName, logo: '', colour: '#3B82F6' })
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCrop, setShowCrop] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>('')
  const [zoom, setZoom] = useState(1)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 100 })
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number; cropX: number; cropY: number } | null>(null)
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; cropX: number; cropY: number; width: number; height: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 })

  // Reset form when modal opens/closes or initialName/editingPlatform changes
  useEffect(() => {
    if (isOpen) {
      if (editingPlatform) {
        // Edit mode: populate with existing data
        setFormData({
          name: editingPlatform.name,
          logo: editingPlatform.logo || '',
          colour: editingPlatform.colour || '#3B82F6',
        })
      } else {
        // Create mode: use initialName or empty
        setFormData({ name: initialName, logo: '', colour: '#3B82F6' })
      }
      setShowCrop(false)
      setImageSrc('')
      setZoom(1)
      setCropArea({ x: 0, y: 0, width: 200, height: 100 })
      setImageDimensions({ width: 0, height: 0 })
      setImageDisplaySize({ width: 0, height: 0, offsetX: 0, offsetY: 0 })
      setIsResizing(false)
      setIsDragging(false)
      setResizeHandle(null)
    }
  }, [isOpen, initialName, editingPlatform])

  // Calculate image display size when image loads or container resizes
  useEffect(() => {
    if (!imageSrc || !imageRef.current || !containerRef.current) return

    const updateDisplaySize = () => {
      if (!imageRef.current || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const img = imageRef.current
      
      const imageAspect = img.naturalWidth / img.naturalHeight
      const containerAspect = containerRect.width / containerRect.height
      
      let displayWidth: number
      let displayHeight: number
      let offsetX = 0
      let offsetY = 0
      
      if (imageAspect > containerAspect) {
        // Image is wider - fit to width
        displayWidth = containerRect.width
        displayHeight = containerRect.width / imageAspect
        offsetY = (containerRect.height - displayHeight) / 2
      } else {
        // Image is taller - fit to height
        displayHeight = containerRect.height
        displayWidth = containerRect.height * imageAspect
        offsetX = (containerRect.width - displayWidth) / 2
      }
      
      setImageDisplaySize({ width: displayWidth, height: displayHeight, offsetX, offsetY })
    }

    const img = imageRef.current
    if (img.complete) {
      updateDisplaySize()
    } else {
      img.onload = updateDisplaySize
    }

    window.addEventListener('resize', updateDisplaySize)
    return () => window.removeEventListener('resize', updateDisplaySize)
  }, [imageSrc, zoom])

  // Handle paste events
  useEffect(() => {
    if (!isOpen || showCrop) return

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await processImageFile(file)
          }
        }
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isOpen, showCrop])

  const processImageFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Skip SVG files - they don't need cropping
    if (file.type === 'image/svg+xml') {
      setUploadingLogo(true)
      try {
        const textReader = new FileReader()
        textReader.onload = (evt) => {
          const svgText = evt.target?.result as string
          setFormData(prev => ({ ...prev, logo: svgText }))
          setUploadingLogo(false)
        }
        textReader.readAsText(file)
      } catch (error) {
        console.error('Error reading SVG:', error)
        setUploadingLogo(false)
        alert('Failed to process SVG')
      }
      return
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    setUploadingLogo(true)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImageSrc(result)
        
        // Load image to get dimensions
        const img = new Image()
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
          // Initialize crop area to center 50% of image
          const initialWidth = img.naturalWidth * 0.5
          const initialHeight = img.naturalHeight * 0.5
          setCropArea({
            x: img.naturalWidth * 0.25,
            y: img.naturalHeight * 0.25,
            width: initialWidth,
            height: initialHeight
          })
        }
        img.src = result
        setShowCrop(true)
        setUploadingLogo(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing image:', error)
      setUploadingLogo(false)
      alert('Failed to process image')
    }
  }

  // Convert screen coordinates to image coordinates
  const screenToImageCoords = (screenX: number, screenY: number): { x: number; y: number } => {
    if (!containerRef.current || !imageRef.current) return { x: 0, y: 0 }
    
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const scale = imageDimensions.width / imageDisplaySize.width
    
    const relativeX = screenX - containerRect.left - imageDisplaySize.offsetX
    const relativeY = screenY - containerRect.top - imageDisplaySize.offsetY
    
    return {
      x: relativeX * scale,
      y: relativeY * scale
    }
  }

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      cropX: cropArea.x,
      cropY: cropArea.y,
      width: cropArea.width,
      height: cropArea.height
    })
  }

  // Handle drag start (moving crop area)
  const handleDragStart = (e: React.MouseEvent) => {
    if (isResizing) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      cropX: cropArea.x,
      cropY: cropArea.y
    })
  }

  // Handle resize
  useEffect(() => {
    if (!isResizing || !resizeStart || !resizeHandle || !imageRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const imageWidth = imageDimensions.width
      const imageHeight = imageDimensions.height
      
      // Convert mouse movement to image coordinates
      const startCoords = screenToImageCoords(resizeStart.x, resizeStart.y)
      const currentCoords = screenToImageCoords(e.clientX, e.clientY)
      
      const deltaX = currentCoords.x - startCoords.x
      const deltaY = currentCoords.y - startCoords.y
      
      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newCropX = resizeStart.cropX
      let newCropY = resizeStart.cropY
      
      switch (resizeHandle) {
        case 'nw': // Top-left
          newWidth = Math.max(50, resizeStart.width - deltaX)
          newHeight = Math.max(50, resizeStart.height - deltaY)
          newCropX = Math.max(0, resizeStart.cropX + deltaX)
          newCropY = Math.max(0, resizeStart.cropY + deltaY)
          break
        case 'ne': // Top-right
          newWidth = Math.max(50, resizeStart.width + deltaX)
          newHeight = Math.max(50, resizeStart.height - deltaY)
          newCropY = Math.max(0, resizeStart.cropY + deltaY)
          break
        case 'sw': // Bottom-left
          newWidth = Math.max(50, resizeStart.width - deltaX)
          newHeight = Math.max(50, resizeStart.height + deltaY)
          newCropX = Math.max(0, resizeStart.cropX + deltaX)
          break
        case 'se': // Bottom-right
          newWidth = Math.max(50, Math.min(imageWidth - resizeStart.cropX, resizeStart.width + deltaX))
          newHeight = Math.max(50, Math.min(imageHeight - resizeStart.cropY, resizeStart.height + deltaY))
          break
        case 'n': // Top
          newHeight = Math.max(50, resizeStart.height - deltaY)
          newCropY = Math.max(0, resizeStart.cropY + deltaY)
          break
        case 's': // Bottom
          newHeight = Math.max(50, Math.min(imageHeight - resizeStart.cropY, resizeStart.height + deltaY))
          break
        case 'e': // Right
          newWidth = Math.max(50, Math.min(imageWidth - resizeStart.cropX, resizeStart.width + deltaX))
          break
        case 'w': // Left
          newWidth = Math.max(50, resizeStart.width - deltaX)
          newCropX = Math.max(0, resizeStart.cropX + deltaX)
          break
      }
      
      // Ensure crop area stays within image bounds
      newCropX = Math.max(0, Math.min(imageWidth - newWidth, newCropX))
      newCropY = Math.max(0, Math.min(imageHeight - newHeight, newCropY))
      newWidth = Math.min(imageWidth - newCropX, newWidth)
      newHeight = Math.min(imageHeight - newCropY, newHeight)
      
      setCropArea({ x: newCropX, y: newCropY, width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeHandle(null)
      setResizeStart(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeStart, resizeHandle, imageDimensions])

  // Handle drag (moving crop area)
  useEffect(() => {
    if (!isDragging || !dragStart || !imageRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const imageWidth = imageDimensions.width
      const imageHeight = imageDimensions.height
      
      // Convert mouse movement to image coordinates
      const startCoords = screenToImageCoords(dragStart.x, dragStart.y)
      const currentCoords = screenToImageCoords(e.clientX, e.clientY)
      
      const deltaX = currentCoords.x - startCoords.x
      const deltaY = currentCoords.y - startCoords.y
      
      let newCropX = dragStart.cropX + deltaX
      let newCropY = dragStart.cropY + deltaY
      
      // Keep crop area within image bounds
      newCropX = Math.max(0, Math.min(imageWidth - cropArea.width, newCropX))
      newCropY = Math.max(0, Math.min(imageHeight - cropArea.height, newCropY))
      
      setCropArea(prev => ({ ...prev, x: newCropX, y: newCropY }))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragStart(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, cropArea.width, cropArea.height, imageDimensions])

  // Calculate crop area style in screen coordinates
  const getCropAreaStyle = (): React.CSSProperties => {
    if (!imageSrc || imageDisplaySize.width === 0) {
      return { display: 'none' }
    }
    
    const scale = imageDisplaySize.width / imageDimensions.width
    
    return {
      position: 'absolute',
      left: `${imageDisplaySize.offsetX + (cropArea.x * scale)}px`,
      top: `${imageDisplaySize.offsetY + (cropArea.y * scale)}px`,
      width: `${cropArea.width * scale}px`,
      height: `${cropArea.height * scale}px`,
      border: '2px solid #3b82f6',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
      cursor: isDragging ? 'grabbing' : 'move',
      zIndex: 10
    }
  }

  const createCroppedImage = async (imageSrc: string, crop: CropArea): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    canvas.width = crop.width
    canvas.height = crop.height

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'))
            return
          }
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        },
        'image/png',
        0.95
      )
    })
  }

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.src = url
    })
  }

  const handleCropComplete = async () => {
    if (!imageSrc) return

    try {
      setUploadingLogo(true)
      const croppedImage = await createCroppedImage(imageSrc, cropArea)
      setFormData(prev => ({ ...prev, logo: croppedImage }))
      setShowCrop(false)
      setImageSrc('')
      setUploadingLogo(false)
    } catch (error) {
      console.error('Error cropping image:', error)
      setUploadingLogo(false)
      alert('Failed to crop image')
    }
  }

  const handleCancelCrop = () => {
    setShowCrop(false)
    setImageSrc('')
    setZoom(1)
    setCropArea({ x: 0, y: 0, width: 200, height: 100 })
    setImageDimensions({ width: 0, height: 0 })
    setImageDisplaySize({ width: 0, height: 0, offsetX: 0, offsetY: 0 })
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processImageFile(file)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a name')
      return
    }

    setSaving(true)
    try {
      let result: Platform | null = null
      
      if (isEditing && editingPlatform) {
        // Update existing platform
        result = await updatePlatform(editingPlatform.id, {
          name: formData.name.trim(),
          logo: formData.logo || undefined,
          colour: formData.colour,
        })
        
        if (result) {
          onSuccess(result)
          setFormData({ name: '', logo: '', colour: '#3B82F6' })
          onClose()
        } else {
          alert('Failed to update platform')
        }
      } else {
        // Create new platform
        result = await createPlatform(
          formData.name.trim(),
          formData.colour,
          formData.logo || undefined
        )
        
        if (result) {
          onSuccess(result)
          setFormData({ name: '', logo: '', colour: '#3B82F6' })
          onClose()
        } else {
          alert('Failed to create platform')
        }
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} platform:`, error)
      alert(`Failed to ${isEditing ? 'update' : 'create'} platform`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', logo: '', colour: '#3B82F6' })
    onClose()
  }

  const renderLogo = (logo: string) => {
    if (!logo) {
      return (
        <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
          <span className="text-xs text-gray-400">No logo</span>
        </div>
      )
    }

    if (logo.startsWith('<svg') || logo.startsWith('<?xml')) {
      // SVG content
      return (
        <div 
          className="w-16 h-16 border border-gray-300 rounded-lg flex items-center justify-center bg-white p-2"
          dangerouslySetInnerHTML={{ __html: logo }}
        />
      )
    }

    // Base64 image
    return (
      <img 
        src={logo} 
        alt="Logo" 
        className="w-16 h-16 object-contain border border-gray-300 rounded-lg bg-white p-2"
      />
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={isEditing ? 'Edit Platform' : 'Add Platform'}
      size="md"
      closeOnOverlayClick={false}
      footerContent={
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || !formData.name.trim()}
          >
            {saving ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save' : 'Create')}
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Stripe, Auth0, Mailchimp"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colour
          </label>
          <div className="flex items-center gap-2 mb-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, colour: color }))}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  formData.colour === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                disabled={saving}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: formData.colour }}
            />
            Selected: {formData.colour}
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Or enter custom hex color
            </label>
            <input
              type="text"
              value={formData.colour}
              onChange={(e) => setFormData(prev => ({ ...prev, colour: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="#RRGGBB"
              pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo
          </label>
          {!showCrop ? (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {renderLogo(formData.logo)}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-gray-500">
                    Or paste an image (Ctrl+V / Cmd+V). SVG, PNG, or JPG. Max 2MB.
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    💡 Use horizontal logos on a white background
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                ref={containerRef}
                className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden"
              >
                {/* Image */}
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop source"
                  className="absolute top-0 left-0 w-full h-full object-contain"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center'
                  }}
                />
                
                {/* Crop area overlay */}
                <div 
                  style={getCropAreaStyle()}
                  onMouseDown={handleDragStart}
                >
                  {/* Corner handles */}
                  <div
                    className="absolute -top-2 -left-2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleResizeStart(e, 'nw')
                    }}
                  />
                  <div
                    className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleResizeStart(e, 'ne')
                    }}
                  />
                  <div
                    className="absolute -bottom-2 -left-2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-nesw-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleResizeStart(e, 'sw')
                    }}
                  />
                  <div
                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-nwse-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleResizeStart(e, 'se')
                    }}
                  />
                  {/* Edge handles */}
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-ns-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleResizeStart(e, 'n')
                    }}
                  />
                  <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-ns-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleResizeStart(e, 's')
                    }}
                  />
                  <div
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-ew-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleResizeStart(e, 'w')
                    }}
                  />
                  <div
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full cursor-ew-resize hover:bg-blue-600 transition-colors"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleResizeStart(e, 'e')
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Zoom</label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    onClick={handleCancelCrop}
                    disabled={uploadingLogo}
                  >
                    <X size={16} className="mr-2" />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCropComplete}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? 'Processing...' : 'Apply Crop'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-blue-600 font-medium">
                💡 Drag the edges or corners to resize, drag the center to move. Use horizontal logos on a white background.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

