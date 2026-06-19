import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  delay: number
  opacity: number
}

export default function NeuralAnimation() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const initial: Particle[] = Array.from({ length: 18 }, () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      speed: Math.random() * 25 + 20,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.06 + 0.03,
    }))
    setParticles(initial)

    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => {
          let nx = p.x + (Math.random() - 0.5) * 1.2
          let ny = p.y + (Math.random() - 0.5) * 1.2
          return {
            ...p,
            x: ((nx % 100) + 100) % 100,
            y: ((ny % 100) + 100) % 100,
          }
        })
      )
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-brand-500"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
            y: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
          }}
          transition={{
            duration: p.speed,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
