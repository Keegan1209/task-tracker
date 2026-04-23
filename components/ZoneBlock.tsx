'use client'

import { useState } from 'react'
import { motion, TargetAndTransition, Transition } from 'framer-motion'

interface ZoneBlockProps {
  children: React.ReactNode
  hoverColor: string
  label: string
  className?: string
  animate?: boolean
  initial?: Record<string, unknown>
  animateState?: TargetAndTransition
  exit?: TargetAndTransition
  transition?: Transition
  hasPersistentHover?: boolean
}

export default function ZoneBlock({
  children,
  hoverColor,
  label,
  className = '',
  animate,
  initial,
  animateState,
  exit,
  transition,
  hasPersistentHover = false,
}: ZoneBlockProps) {
  const [hovered, setHovered] = useState(false)

  const isActive = hasPersistentHover || hovered

  const style: React.CSSProperties = {
    position: 'relative',
    backgroundColor: '#181D2A',
    border: `1px solid ${isActive ? hoverColor + '33' : '#252D3D'}`,
    borderTop: `3px solid ${isActive ? hoverColor : '#252D3D'}`,
    borderRadius: '14px',
    padding: '20px',
    transition: 'border-color 0.25s ease, border-top-color 0.25s ease, box-shadow 0.25s ease',
    boxShadow: isActive
      ? `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${hoverColor}22, inset 0 1px 0 ${hoverColor}18`
      : '0 2px 8px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  }

  const dotPattern = isActive ? (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(${hoverColor}18 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        borderRadius: '14px',
        pointerEvents: 'none',
        transition: 'opacity 0.3s ease',
        opacity: 1,
      }}
    />
  ) : null

  const content = (
    <>
      {dotPattern}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </>
  )

  if (animate) {
    return (
      <motion.section
        initial={initial as TargetAndTransition}
        animate={animateState}
        exit={exit}
        transition={transition}
        style={style}
        className={className}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {content}
      </motion.section>
    )
  }

  return (
    <section
      style={style}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {content}
    </section>
  )
}
