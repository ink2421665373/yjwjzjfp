import { useEffect, useRef } from 'react'

const ParticleBackground = () => {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const mouseParticlesRef = useRef([])
  const mouseRef = useRef({ x: null, y: null })
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const particleCount = Math.floor((canvas.width * canvas.height) / 8000)
    particlesRef.current = []
    
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        opacity: Math.random() * 0.7 + 0.4,
        color: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.01
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      bgGradient.addColorStop(0, '#f8fafc')
      bgGradient.addColorStop(0.5, '#f1f5f9')
      bgGradient.addColorStop(1, '#e2e8f0')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current
      const mouseParticles = mouseParticlesRef.current
      const mouse = mouseRef.current

      particles.forEach(p => {
        let newX = p.x + p.speedX
        let newY = p.y + p.speedY

        if (newX < 0 || newX > canvas.width) p.speedX *= -1
        if (newY < 0 || newY > canvas.height) p.speedY *= -1

        p.x = Math.max(0, Math.min(canvas.width, newX))
        p.y = Math.max(0, Math.min(canvas.height, newY))

        p.pulse += p.pulseSpeed
        const currentSize = p.size * (1 + Math.sin(p.pulse) * 0.3)
        const currentOpacity = p.opacity * (1 + Math.sin(p.pulse) * 0.2)

        const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 6)
        glowGradient.addColorStop(0, p.color)
        glowGradient.addColorStop(0.2, p.color)
        glowGradient.addColorStop(0.5, p.color + '80')
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.globalAlpha = currentOpacity * 0.6
        ctx.beginPath()
        ctx.arc(p.x, p.y, currentSize * 6, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = currentOpacity
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, currentSize * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = currentOpacity * 0.8
        ctx.fill()

        if (mouse.x !== null) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 120) {
            const force = (120 - distance) / 120 * 0.4
            p.x -= dx * force * 0.08
            p.y -= dy * force * 0.08
          }
        }
      })

      ctx.globalAlpha = 0.25
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = p1.color
            ctx.globalAlpha = (1 - distance / 150) * 0.3
            ctx.lineWidth = 1.5
            ctx.stroke()
          }
        })
      })

      if (mouse.x !== null) {
        const glowGradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200)
        glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)')
        glowGradient.addColorStop(0.4, 'rgba(139, 92, 246, 0.08)')
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 200, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1

      mouseParticlesRef.current = mouseParticles.filter(p => p.life > 0)
      mouseParticlesRef.current.forEach(p => {
        p.x += p.speedX
        p.y += p.speedY
        p.speedY += 0.12
        p.life -= 0.012
        p.size *= 0.96

        const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        glowGradient.addColorStop(0, p.color)
        glowGradient.addColorStop(0.5, p.color + '80')
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.globalAlpha = p.life * 0.8
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.life
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = p.life * 0.9
        ctx.fill()
      })

      ctx.globalAlpha = 1

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const drawBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#f8fafc')
      gradient.addColorStop(0.5, '#f1f5f9')
      gradient.addColorStop(1, '#e2e8f0')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    drawBackground()
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null }
    }

    const handleClick = (e) => {
      const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4']
      
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.5
        const speed = Math.random() * 8 + 3
        
        mouseParticlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          speedX: Math.cos(angle) * speed,
          speedY: Math.sin(angle) * speed,
          size: Math.random() * 8 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1
        })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  )
}

export default ParticleBackground
