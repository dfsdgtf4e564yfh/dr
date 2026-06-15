import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, Square, Play, Trash2, Check, Loader2 } from 'lucide-react'
import { uploadVoiceNote } from '../services/api'
import { toPersianDigits } from '../utils/jalali'
import Button from './Button'

interface VoiceRecorderProps {
  recordId: number
  onTranscriptionComplete?: (text: string) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function VoiceRecorder({ recordId, onTranscriptionComplete }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [transcription, setTranscription] = useState('')

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunks.current = []
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorder.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
      }

      recorder.start()
      setRecording(true)
      setElapsed(0)
      setAudioUrl(null)
      setTranscription('')

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
    } catch {
      alert('دسترسی به میکروفون مجاز نیست')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    setRecording(false)
  }, [])

  const discardRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setElapsed(0)
    setTranscription('')
  }, [audioUrl])

  const saveRecording = useCallback(async () => {
    if (!audioUrl) return
    setUploading(true)
    try {
      const blob = new Blob(chunks.current, { type: 'audio/webm' })
      const { data } = await uploadVoiceNote(recordId, blob)
      setTranscription(data.voice_transcription)
      onTranscriptionComplete?.(data.voice_transcription)
    } catch {
      alert('خطا در آپلود فایل صوتی')
    } finally {
      setUploading(false)
    }
  }, [audioUrl, recordId, onTranscriptionComplete])

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
      <div className="flex items-center gap-2">
        {!recording && !audioUrl && (
          <Button size="xs" variant="outline" icon={Mic} onClick={startRecording}>
            شروع ضبط
          </Button>
        )}
        {recording && (
          <div className="flex items-center gap-2">
            <span className="text-red-500 animate-pulse text-xs font-bold">●</span>
            <span className="text-sm font-mono text-slate-600">{toPersianDigits(formatTime(elapsed))}</span>
            <Button size="xs" variant="danger" icon={Square} onClick={stopRecording}>
              توقف
            </Button>
          </div>
        )}
        {audioUrl && !recording && (
          <div className="flex items-center gap-2 w-full">
            <audio src={audioUrl} controls className="h-8 flex-1" />
            <Button size="xs" variant="ghost" icon={Trash2} onClick={discardRecording} />
            <Button size="xs" variant="gradient" icon={uploading ? Loader2 : Check} loading={uploading} onClick={saveRecording}>
              ثبت
            </Button>
          </div>
        )}
      </div>
      {transcription && (
        <p className="text-xs text-slate-500 bg-white rounded-lg p-2 border border-slate-100">
          {transcription}
        </p>
      )}
    </div>
  )
}
