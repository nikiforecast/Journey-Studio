import React, { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Edit, ImageIcon } from 'lucide-react'
import { UserRoleTag } from '../../common/UserRoleTag'
import type { UserRole, ThirdParty, Platform } from '../../../lib/supabase'
import { convertEmojis } from '../../../utils/emojiConverter'
import { renderMarkdown } from '../../../utils/markdownRenderer'
import { ImageLightbox } from '../../ImageLightbox'

export type UserJourneyNodeType = 'start' | 'process' | 'decision' | 'end' | 'label'

export type NotificationType = 'pain-point' | 'warning' | 'info' | 'positive'

export interface Notification {
  id: string
  type: NotificationType
  message: string
}

export interface UserJourneyNodeData {
  label: string
  type: UserJourneyNodeType
  userRole?: UserRole
  customUserRoleName?: string
  customUserRoleEmoji?: string
  bulletPoints?: string[]
  notifications?: Notification[]
  customProperties?: Record<string, unknown>
  variant?: 'CMS' | 'Legl' | 'End client' | 'Back end' | 'Third party' | 'Custom' | ''
  thirdPartyName?: string
  customPlatformName?: string
  imageUrl?: string
  nodeLayout?: string // Layout classification: 'Simple node', 'Branch node', 'Branch-child node', 'Convergent node', 'Divergent node'
  journeyLayout?: 'vertical' | 'horizontal' // Overall journey layout direction
}

interface UserJourneyNodeProps {
  id: string
  data: UserJourneyNodeData
  selected?: boolean
  showHandles?: boolean
  thirdParties?: ThirdParty[]
  platforms?: Platform[]
  onEdit?: () => void
  isConnecting?: boolean
  connectedEdges?: Array<{ sourceHandle?: string | null; targetHandle?: string | null; source: string; target: string }>
  userRoleEmojiOverrides?: Record<string, string> // Journey-specific emoji overrides: { roleId: emoji }
  handleArrowStates?: string[] // Array of handle IDs that should be arrows for this node
  onHandleArrowToggle?: (nodeId: string, handleId: string) => void // Callback to update handle arrow state
}

export function UserJourneyNode({ id, data, selected, showHandles = false, thirdParties = [], platforms = [], onEdit, isConnecting = false, connectedEdges = [], userRoleEmojiOverrides = {}, handleArrowStates = [], onHandleArrowToggle }: UserJourneyNodeProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const nodeData = data as UserJourneyNodeData
  const {
    label = '',
    type = 'process',
    userRole,
    customUserRoleName = '',
    customUserRoleEmoji = '',
    bulletPoints = [],
    notifications = [],
    customProperties = {},
    variant = '',
    thirdPartyName = '',
    customPlatformName = '',
    journeyLayout = 'vertical',
    imageUrl = ''
  } = nodeData || {}
  
  // Get notification styling based on type
  const getNotificationStyle = (notifType: NotificationType) => {
    switch (notifType) {
      case 'pain-point':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-900',
        }
      case 'info':
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-700',
        }
      case 'positive':
        return {
          bg: 'bg-green-50',
          border: 'border-green-300',
          text: 'text-green-800',
        }
    }
  }
  
  // Find matching third party logo (case-insensitive)
  // Check for matching third party for either 'Third party' or 'Custom' variant
  const platformName = variant === 'Custom' ? customPlatformName : thirdPartyName
  const matchingThirdParty = thirdParties.find(
    tp => tp.name.toLowerCase() === platformName.toLowerCase()
  )
  
  // Find matching platform logo
  // First check if variant matches a platform name
  // Then check if customPlatformName matches a platform name (for Custom variants)
  let matchingPlatform = platforms.find(p => p.name === variant)
  if (!matchingPlatform && variant === 'Custom' && customPlatformName) {
    matchingPlatform = platforms.find(p => 
      p.name.toLowerCase() === customPlatformName.toLowerCase()
    )
  }
  
  // Generate unique gradient ID for Legl logo
  const gradientId = `legl-gradient-${id}`

  // Platform-specific border color - use color from database platform
  const getBorderColor = () => {
    if (!variant) {
      return '#5A6698'
    }

    if (variant === 'Custom') {
      if (customPlatformName) {
        const platform = platforms.find(p =>
          p.name.toLowerCase() === customPlatformName.toLowerCase()
        )
        return platform?.colour || '#5A6698'
      }
      return '#5A6698'
    }

    const platform = platforms.find(p => p.name === variant)
    return platform?.colour || '#5A6698'
  }

  const borderColor = getBorderColor()

  // Track hover state for showing connectors
  const [isHovered, setIsHovered] = React.useState(false)
  
  // Track which handles are arrows (Set of handle IDs)
  const arrowHandles = React.useMemo(() => new Set(handleArrowStates), [handleArrowStates.join(',')])
  
  // Track hover state for individual handles
  const [hoveredHandleId, setHoveredHandleId] = React.useState<string | null>(null)
  
  // Toggle arrow state for a handle
  const toggleHandleArrow = (handleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onHandleArrowToggle) {
      onHandleArrowToggle(id, handleId)
    }
  }
  

  // Get all handle positions - all nodes can connect from any side
  const getAllHandlePositions = () => {
    // All nodes have handles on all 4 sides
    // Each side has both source and target handles with unique IDs
    return [
      { type: 'source' as const, position: Position.Top, id: 'source-top' },
      { type: 'source' as const, position: Position.Right, id: 'source-right' },
      { type: 'source' as const, position: Position.Bottom, id: 'source-bottom' },
      { type: 'source' as const, position: Position.Left, id: 'source-left' },
      { type: 'target' as const, position: Position.Top, id: 'target-top' },
      { type: 'target' as const, position: Position.Right, id: 'target-right' },
      { type: 'target' as const, position: Position.Bottom, id: 'target-bottom' },
      { type: 'target' as const, position: Position.Left, id: 'target-left' },
    ]
  }

  // Extract the side from handle ID (e.g., 'source-top' -> 'top')
  const getHandleSide = (handleId: string): string => {
    return handleId.replace(/^(source|target)-/, '')
  }

  // Check if a handle has an edge connected to it
  // Supports:
  // - New format (full IDs like 'source-top', 'target-top')
  // - Old format (simple IDs like 'top', 'bottom')
  // - No handle ID (null/undefined - React Flow will use default handles)
  const hasEdgeOnHandle = (handleId: string, handleType: 'source' | 'target') => {
    if (handleType === 'source') {
      return connectedEdges.some(edge => {
        if (edge.source !== id) return false
        
        // If edge has no sourceHandle, React Flow will use default handles
        // In this case, we can't definitively match, but we'll show handles if node has any edges
        // For now, only match if handle ID is explicitly set
        if (!edge.sourceHandle) {
          // Don't match edges without handle IDs to specific handles
          // This prevents showing all handles when edges don't have explicit handles
          return false
        }
        
        // Check for exact match (new format: 'source-top')
        if (edge.sourceHandle === handleId) return true
        
        // Extract side from handle ID (e.g., 'source-top' -> 'top')
        const handleSide = getHandleSide(handleId)
        
        // Check for side match (old format: 'top' matches 'source-top')
        if (edge.sourceHandle === handleSide) return true
        
        // Handle reverse: edge has new format but we're checking old format handle
        const edgeSide = edge.sourceHandle.replace(/^(source|target)-/, '')
        if (edgeSide === handleSide) return true
        
        return false
      })
    } else {
      return connectedEdges.some(edge => {
        if (edge.target !== id) return false
        
        // If edge has no targetHandle, React Flow will use default handles
        // In this case, we can't definitively match, but we'll show handles if node has any edges
        // For now, only match if handle ID is explicitly set
        if (!edge.targetHandle) {
          // Don't match edges without handle IDs to specific handles
          // This prevents showing all handles when edges don't have explicit handles
          return false
        }
        
        // Check for exact match (new format: 'target-top')
        if (edge.targetHandle === handleId) return true
        
        // Extract side from handle ID (e.g., 'target-top' -> 'top')
        const handleSide = getHandleSide(handleId)
        
        // Check for side match (old format: 'top' matches 'target-top')
        // This is the key fix: old edges have 'top', new handles have 'target-top'
        if (edge.targetHandle === handleSide) return true
        
        // Handle reverse: edge has new format but we're checking old format handle
        const edgeSide = edge.targetHandle.replace(/^(source|target)-/, '')
        if (edgeSide === handleSide) return true
        
        return false
      })
    }
  }

  // Determine if a handle should be visible
  const shouldShowHandle = (handleId: string, handleType: 'source' | 'target') => {
    // Always show if connecting (dragging an edge)
    if (isConnecting) return true
    
    // Show if hovered (user is hovering over the node)
    if (isHovered) return true
    
    // IMPORTANT: Always show handles that have edges connected
    // This ensures React Flow can calculate edge paths correctly
    if (hasEdgeOnHandle(handleId, handleType)) return true
    
    // Hide empty handles when not hovering or connecting
    return false
  }

  return (
    <div
      data-id={id}
      className={`
        group
        px-4 py-3
        w-[320px]
        bg-white
        border border-gray-200
        rounded-lg
        ${selected ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-md' : ''}
        transition-all duration-200
        hover:shadow-md
        ${customProperties.disabled ? 'opacity-50' : ''}
      `}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: borderColor
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onEdit?.()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles - show on all sides, visible on hover or when connecting */}
      {/* IMPORTANT: All handles must always be rendered so React Flow can register them and calculate edge paths */}
      {type !== 'label' && getAllHandlePositions().map((handle, index) => {
        const isVisible = shouldShowHandle(handle.id, handle.type)
        const hasEdge = hasEdgeOnHandle(handle.id, handle.type)
        const isConnected = hasEdge
        const isHoveredHandle = hoveredHandleId === handle.id
        const shouldBeArrow = arrowHandles.has(handle.id)
        
        return (
          <React.Fragment key={`${handle.type}-${handle.id}-${index}`}>
            <Handle
              type={handle.type}
              position={handle.position}
              id={handle.id}
              isConnectable={true}
              onMouseEnter={() => setHoveredHandleId(handle.id)}
              onMouseLeave={() => setHoveredHandleId(null)}
              onMouseDown={(e) => {
                if (isConnected) {
                  e.stopPropagation()
                }
              }}
              onClick={(e) => {
                if (isConnected) {
                  toggleHandleArrow(handle.id, e)
                }
              }}
              style={{
                width: '16px',
                height: '16px',
                background: shouldBeArrow ? 'transparent' : (isHoveredHandle && isConnected ? '#3b82f6' : (isVisible ? '#9ca3af' : 'transparent')),
                border: shouldBeArrow ? 'none' : (isVisible ? '2px solid white' : 'none'),
                borderRadius: '50%',
                zIndex: 10,
                opacity: hasEdge ? 1 : (isVisible ? 1 : 0),
                pointerEvents: isVisible || hasEdge ? 'all' : 'none',
                transition: 'background 0.2s ease-in-out, border 0.2s ease-in-out, opacity 0.2s ease-in-out',
                cursor: isConnected ? 'pointer' : (isVisible ? 'crosshair' : 'default'),
              }}
            />
            {/* Arrow shape overlay when handle is arrow */}
            {shouldBeArrow && (
              <div
                style={{
                  position: 'absolute',
                  ...(handle.position === Position.Top && { top: '-8px', left: '50%', transform: 'translateX(-50%) rotate(180deg)' }),
                  ...(handle.position === Position.Right && { right: '-8px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)' }),
                  ...(handle.position === Position.Bottom && { bottom: '-8px', left: '50%', transform: 'translateX(-50%) rotate(0deg)' }),
                  ...(handle.position === Position.Left && { left: '-8px', top: '50%', transform: 'translateY(-50%) rotate(90deg)' }),
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderBottom: '10px solid',
                  borderBottomColor: isHoveredHandle && isConnected ? '#3b82f6' : (isVisible ? '#9ca3af' : '#9ca3af'),
                  pointerEvents: 'none', // Ensure arrow doesn't block handle clicks
                  zIndex: 10, // Lower than handle's z-index (12) so handles capture events
                  opacity: hasEdge ? 1 : (isVisible ? 1 : 0),
                  transition: 'border-bottom-color 0.2s ease-in-out, opacity 0.2s ease-in-out',
                }}
              />
            )}
          </React.Fragment>
        )
      })}

      {/* Title Row: Title + Image + Edit button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 text-base font-semibold text-gray-900 break-words">
          {convertEmojis(label)}
        </div>
        
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {imageUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsLightboxOpen(true)
              }}
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-150"
              title="View image"
            >
              <ImageIcon size={14} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-150"
            title="Edit node"
          >
            <Edit size={14} />
          </button>
        </div>
      </div>
      
      {/* Bullet Points - Full width */}
      {bulletPoints && bulletPoints.filter(b => b && b.trim()).length > 0 && (
        <ul className="mt-2 space-y-1">
          {bulletPoints.filter(b => b && b.trim()).map((bullet, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-start gap-1.5">
              <span className="text-gray-400 mt-0.5">•</span>
              <span className="flex-1">{renderMarkdown(bullet)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Notifications - Full width */}
      {notifications && notifications.filter(n => n.message && n.message.trim()).length > 0 && (
        <div className={`space-y-1.5 ${bulletPoints.filter(b => b && b.trim()).length > 0 ? 'mt-2' : 'mt-2'}`}>
          {notifications
            .filter(n => n.message && n.message.trim())
            .map((notification) => {
            const style = getNotificationStyle(notification.type)
            return (
              <div
                key={notification.id}
                className={`
                  ${style.bg} ${style.border} ${style.text}
                  border rounded px-2 py-1.5
                  text-xs
                `}
              >
                <span>{convertEmojis(notification.message)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* User Role Tag and Platform Label */}
      {/* Show only if userRole, customUserRoleName, or variant is actually set (not empty) */}
      {/* For label nodes, only show platform (hide user role) */}
      {(userRole || (customUserRoleName && customUserRoleName.trim()) || (variant && variant.trim())) && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            {type !== 'label' && (
              <>
                {userRole && (() => {
                  // Use journey-specific emoji override if available, otherwise use global emoji
                  // If override is empty string, use empty string (removes emoji)
                  const emojiOverride = userRoleEmojiOverrides[userRole.id]
                  const userRoleWithOverride = emojiOverride !== undefined
                    ? { ...userRole, icon: emojiOverride }
                    : userRole
                  
                  return (
                    <UserRoleTag
                      userRole={userRoleWithOverride}
                      size="sm"
                    />
                  )
                })()}
                {!userRole && customUserRoleName && (
                  <div className="inline-flex items-center rounded-full font-medium px-2 py-1 text-xs gap-2 bg-gray-100 text-gray-700">
                    {customUserRoleEmoji && (
                      <span 
                        style={{ 
                          fontSize: 14,
                          lineHeight: 1
                        }}
                      >
                        {customUserRoleEmoji}
                      </span>
                    )}
                    <span>{customUserRoleName}</span>
                  </div>
                )}
              </>
            )}
          </div>
          <div>
            {variant && variant.trim() && (
              variant === 'Legl' ? (
                <div className="w-10 h-5">
                  <svg viewBox="0 0 39 21" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id={gradientId} x1="39.7" y1="-.8" x2=".8" y2="22.2" gradientTransform="translate(0 22) scale(1 -1)" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#01b88e"/>
                        <stop offset=".9" stopColor="#86dbc8"/>
                      </linearGradient>
                    </defs>
                    <path fill={`url(#${gradientId})`} d="M10.1.7h18.4c5.5,0,10,4.5,10,10h0c0,5.5-4.5,10-10,10H10.1C4.6,20.7.1,16.2.1,10.7H.1C.1,5.2,4.6.7,10.1.7Z"/>
                    <path fill="#fff" d="M27.1,7.9c0,0,.1,0,.1.1v.7s0,4.6,0,4.6c0,.5,0,.9-.1,1.3-.4,1.1-1.3,1.9-2.3,2.2-.3,0-.6.1-.9.1,0,0,0,0,0,0-1.2,0-2.3-.6-2.9-1.6,0-.2.1-.8.4-.7.3.2,1.3.7,2.1.7s1.2-.3,1.5-.5c.2-.2.4-.7.4-1.2v-.2h0c-.4.5-1,.9-1.9.9-1.5,0-2.9-1.1-2.9-3.1,0-2,1.4-3.1,2.9-3.1,1,0,1.6.5,1.9.9v-.6s0,0,0-.1c.5-.4,1.2-.6,1.8-.6h0ZM30,4.7c0,0,.1,0,.1.1v8.8s0,0,0,.1c-.6.4-1.2.6-2,.6h0c0,0-.1,0-.1-.1V5.5s0,0,0-.1c.6-.4,1.2-.6,2-.6h0ZM16.7,8c1.8,0,3.1,1.2,3.1,3s0,.7,0,.7h-4.4c0,.2,0,.3.1.4,0,.1.1.2.2.3.2.2.6.5,1.4.5.8,0,1.8-.5,2.1-.7.2-.1.5.2.4.4-.6,1-1.7,1.8-2.9,1.8-1.5,0-2.7-1-3.2-2.3,0-.3,0-.6,0-.9,0-2.1,1.5-3.2,3.3-3.2ZM10.4,5.5c0,0,.1,0,.1.1v6.9s0,0,0,0h2.4s0,0,0,0c.3.4.5,1,.5,1.5h0c0,0,0,.1-.1.1h-4.4c-.3,0-.5-.2-.5-.5v-7.4h0,0s.3-.8,1.9-.8ZM23.9,9.9c-.9,0-1.5.7-1.5,1.5s.6,1.5,1.5,1.5c.9,0,1.4-.7,1.4-1.5s-.6-1.5-1.4-1.5ZM16.7,9.3c-.8,0-1.3.7-1.3,1.2h2.5c0-.6-.4-1.2-1.3-1.2Z"/>
                  </svg>
                </div>
              ) : matchingPlatform?.logo ? (
                // Show platform logo if available (prioritize platforms over third parties)
                <div className="flex items-center justify-center h-6">
                  {matchingPlatform.logo.includes('<svg') || matchingPlatform.logo.startsWith('<?xml') ? (
                    <div 
                      className="h-5 flex items-center"
                      dangerouslySetInnerHTML={{ __html: matchingPlatform.logo }}
                    />
                  ) : (
                    <img 
                      src={matchingPlatform.logo} 
                      alt={matchingPlatform.name}
                      className="h-4 object-contain"
                    />
                  )}
                </div>
              ) : ((variant === 'Third party' && thirdPartyName) || (variant === 'Custom' && customPlatformName)) && matchingThirdParty?.logo ? (
                // Fallback to third party logo if platform logo not found (for backward compatibility)
                <div className="flex items-center justify-center h-5">
                  {matchingThirdParty.logo.includes('<svg') || matchingThirdParty.logo.startsWith('<?xml') ? (
                    <div 
                      className="h-5 flex items-center"
                      dangerouslySetInnerHTML={{ __html: matchingThirdParty.logo }}
                    />
                  ) : (
                    <img 
                      src={matchingThirdParty.logo} 
                      alt={platformName}
                      className="h-5 object-contain"
                    />
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  {variant === 'Custom' && customPlatformName ? customPlatformName : variant === 'Third party' && thirdPartyName ? thirdPartyName : variant}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Custom Properties */}
      {Object.keys(customProperties).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
          {Object.entries(customProperties).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              <span className="font-medium">{key}:</span>
              <span className="ml-1">{String(value)}</span>
            </span>
          ))}
        </div>
      )}
      <ImageLightbox
        imageUrl={imageUrl}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        alt={label ? `${label} image` : 'Node image'}
      />
    </div>
  )
}
