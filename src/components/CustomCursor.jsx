import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPointer, setIsPointer] = useState(false)
  const [isMouseDown, setIsMouseDown] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY })
      const target = e.target
      const computedStyle = window.getComputedStyle(target)
      setIsPointer(computedStyle.cursor === 'pointer')
    }

    const handleMouseDown = () => setIsMouseDown(true)
    const handleMouseUp = () => setIsMouseDown(false)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <>
      <style>{`
        * { cursor: none !important; }
        @media (max-width: 768px) {
          * { cursor: auto !important; }
          .custom-cursor { display: none; }
        }
      `}</style>
      
      {}
      <motion.div
        className="custom-cursor"
        animate={{
          x: position.x - 16,
          y: position.y - 16,
          scale: isMouseDown ? 0.8 : isPointer ? 1.5 : 1,
          borderColor: isPointer ? 'var(--accent-blue)' : 'rgba(139, 148, 158, 0.5)'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 250, mass: 0.5 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          border: '1.5px solid',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />

      {}
      <motion.div
        className="custom-cursor"
        animate={{
          x: position.x - 3,
          y: position.y - 3,
          scale: isMouseDown ? 2 : 1,
          backgroundColor: isPointer ? 'var(--accent-blue)' : 'var(--accent-blue)'
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.1 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 10000,
          boxShadow: '0 0 10px var(--accent-blue)'
        }}
      />
    </>
  )
}
