import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Check, Pen } from 'lucide-react'

interface SignaturePadProps {
  value?: string
  onChange?: (dataUrl: string) => void
  height?: number
  label?: string
}

export default function SignaturePad({ value, onChange, height = 160, label }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (value) {
      const img = new Image()
      img.onload = () => { ctx.drawImage(img, 0, 0, rect.width, rect.height); setHasSignature(true) }
      img.src = value
    }
  }, [])

  const getPos = useCallback((e: any) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : (e.clientX ?? e.pageX)
    const clientY = e.touches ? e.touches[0].clientY : (e.clientY ?? e.pageY)
    // Account for HiDPI canvas scaling
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  const startDrawing = useCallback((e: any) => {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
    setIsActive(true)
  }, [getPos])

  const draw = useCallback((e: any) => {
    e.preventDefault()
    if (!isDrawing) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }, [isDrawing, getPos])

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    setIsActive(false)
    setHasSignature(true)
  }, [isDrawing])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onChange?.('')
  }, [onChange])

  const getDataUrl = useCallback((): string | undefined => {
    return canvasRef.current?.toDataURL('image/png')
  }, [])

  const confirm = useCallback(() => {
    const dataUrl = getDataUrl()
    if (dataUrl && hasSignature) onChange?.(dataUrl)
  }, [getDataUrl, hasSignature, onChange])

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}
      <div className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${isActive ? 'border-brand-500 signature-pad active' : 'border-dashed border-surface-300 hover:border-brand-300'}`}>
        <canvas
          ref={canvasRef}
          className="w-full bg-white touch-none select-none"
          style={{ height, cursor: 'crosshair', touchAction: 'none' }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && !isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <div className="flex flex-col items-center gap-2 text-surface-400">
              <Pen size={24} />
              <span className="text-sm font-medium">امضای خود را اینجا رسم کنید</span>
              <span className="text-[11px]">با قلم نوری، موس یا انگشت</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2">
        {hasSignature && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clear}
              className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border-none cursor-pointer"
            >
              <Trash2 size={14} /> پاک کردن
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={confirm}
              className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-success-500 hover:bg-success-50 rounded-xl transition-colors border-none cursor-pointer"
            >
              <Check size={14} /> تایید امضا
            </motion.button>
          </>
        )}
      </div>
    </div>
  )
}
