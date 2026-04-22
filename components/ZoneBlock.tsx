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
}: ZoneBlockProps) {
  const [hovered, setHovered] = useState(false)

  // Audi-inspired: dark elevated card, accent top border on hover
  const style: React.CSSProperties = {
    backgroundColor: '#181D2A',
    border: '1px solid #252D3D',
    borderTop: `3px solid ${hovered ? hoverColor : '#252D3D'}`,
    borderRadius: '14px',
    padding: '20px',
    transition: 'border-top-color 0.25s ease, box-shadow 0.25s ease',
    boxShadow: hovered
      ? `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${hoverColor}22`
      : '0 2px 8px rgba(0,0,0,0.2)',
  }

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
        {children}
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
      {children}
    </section>
  )
}
