import { motion } from 'framer-motion'

interface ShimmerProps {
  className?: string
  style?: React.CSSProperties
}

function Shimmer({ className = '', style }: ShimmerProps) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={style}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
        style={{ animation: 'shimmer 2s infinite' }} />
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  )
}

interface SkeletonTableProps {
  rows?: number
  cols?: number
}

export function SkeletonTable({ rows = 5, cols = 5 }: SkeletonTableProps) {
  return (
    <div className="table-wrap">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-5 py-3.5">
                <Shimmer className="h-3 bg-slate-200 rounded w-3/4 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-5 py-3.5">
                  <Shimmer className="h-3.5 bg-slate-100 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface SkeletonCardProps {
  count?: number
}

export function SkeletonCard({ count = 4 }: SkeletonCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <Shimmer className="w-14 h-14 rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-6 bg-slate-200 rounded w-20" />
              <Shimmer className="h-3 bg-slate-100 rounded w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface SkeletonChartProps {
  height?: number
}

export function SkeletonChart({ height = 280 }: SkeletonChartProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6">
      <Shimmer className="h-4 bg-slate-200 rounded w-32 mb-6" />
      <div className="flex items-end gap-3" style={{ height }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Shimmer key={i} className="flex-1 bg-slate-100 rounded-t-lg" style={{ height: `${30 + Math.random() * 60}%` }} />
        ))}
      </div>
    </div>
  )
}

interface SkeletonLineProps {
  width?: string
  height?: number
}

export function SkeletonLine({ width = '100%', height = 4 }: SkeletonLineProps) {
  return <Shimmer className="bg-slate-100 rounded" style={{ width, height }} />
}
