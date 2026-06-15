interface DecorationProps {
  className?: string
}

export function SectionDivider({ className = '' }: DecorationProps) {
  return (
    <div className={`divider-persian ${className}`} />
  )
}

export function HeaderDecoration({ className = '' }: DecorationProps) {
  return (
    <svg className={`inline-block ${className}`} width="100" height="18" viewBox="0 0 100 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 9H28" stroke="url(#hd1)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M72 9H100" stroke="url(#hd2)" strokeWidth="1.5" strokeLinecap="round" />
      {/* اسلیمی مرکزی */}
      <path d="M35 9 Q38 5 41 9 Q44 13 47 9 Q50 5 53 9 Q56 13 59 9 Q62 5 65 9" stroke="#2ab3b8" strokeWidth="1" fill="none" opacity="0.5" />
      <circle cx="50" cy="9" r="2.5" fill="#1a4a8a" opacity="0.25" />
      <circle cx="50" cy="9" r="1" fill="#2ab3b8" opacity="0.6" />
      <defs>
        <linearGradient id="hd1" x1="0" y1="0" x2="28" y2="0">
          <stop offset="0%" stopColor="#1a4a8a" stopOpacity="0" />
          <stop offset="100%" stopColor="#2ab3b8" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="hd2" x1="0" y1="0" x2="28" y2="0">
          <stop offset="0%" stopColor="#2ab3b8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1a4a8a" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function StarDecoration({ className = '' }: DecorationProps) {
  return (
    <svg className={`inline-block ${className}`} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ستاره هشت پر ایرانی */}
      <path d="M10 1L11.8 7.2L17.6 5L13.8 10L17.6 15L11.8 12.8L10 19L8.2 12.8L2.4 15L6.2 10L2.4 5L8.2 7.2Z" fill="#1a4a8a" opacity="0.12" />
      <circle cx="10" cy="10" r="2" fill="#2ab3b8" opacity="0.35" />
    </svg>
  )
}

export function EslimiMotif({ className = '' }: DecorationProps) {
  return (
    <svg className={`inline-block ${className}`} width="160" height="28" viewBox="0 0 160 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* اسلیمی دو خطی با برگ‌های تزئینی */}
      <path d="M0 14C15 6 30 6 40 14C50 22 65 22 80 14C95 6 110 6 120 14C130 22 145 22 160 14" stroke="#1a4a8a" strokeWidth="0.8" opacity="0.2" fill="none" />
      <path d="M0 14C15 20 30 20 40 14C50 8 65 8 80 14C95 20 110 20 120 14C130 8 145 8 160 14" stroke="#2ab3b8" strokeWidth="0.5" opacity="0.15" fill="none" />
      {/* گل‌های کوچک در گره‌ها */}
      {[20, 60, 100, 140].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="14" r="3" fill="#1a4a8a" opacity="0.08" />
          <circle cx={x} cy="14" r="1.5" fill="#2ab3b8" opacity="0.2" />
        </g>
      ))}
      {/* نقطه‌های تزئینی */}
      {[40, 80, 120].map((x, i) => (
        <g key={`d${i}`}>
          <circle cx={x} cy="14" r="2" fill="#e67e22" opacity="0.12" />
          <circle cx={x} cy="14" r="1" fill="#e67e22" opacity="0.25" />
        </g>
      ))}
    </svg>
  )
}

export function KhatamBorder({ className = '' }: DecorationProps) {
  return (
    <svg className={`inline-block ${className}`} width="100%" height="6" viewBox="0 0 300 6" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="kb1" x1="0" y1="0" x2="300" y2="0">
          <stop offset="0%" stopColor="#1a4a8a" stopOpacity="0" />
          <stop offset="20%" stopColor="#1a4a8a" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#2ab3b8" stopOpacity="0.5" />
          <stop offset="80%" stopColor="#e67e22" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1a4a8a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect y="2.5" width="300" height="1" fill="url(#kb1)" rx="1" />
      {Array.from({length: 15}, (_, i) => (
        <polygon key={i} points={`${i*20+4},3 ${i*20+8},1 ${i*20+12},3 ${i*20+8},5`}
          fill="#1a4a8a" opacity="0.07" />
      ))}
    </svg>
  )
}

export function TazhibCorner({ className = '' }: DecorationProps) {
  return (
    <svg className={`inline-block ${className}`} width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* تذهیب کلاسیک گوشه */}
      <path d="M2 2H14C14 8.63 8.63 14 2 14V2Z" stroke="#1a4a8a" strokeWidth="0.8" opacity="0.18" fill="none" />
      <path d="M4 4H10C10 7.31 7.31 10 4 10V4Z" fill="#2ab3b8" opacity="0.06" />
      <path d="M2 2L5 2M2 5L2 2" stroke="#2ab3b8" strokeWidth="0.7" opacity="0.25" />
      <circle cx="5" cy="5" r="2" fill="#1a4a8a" opacity="0.1" />
      <circle cx="5" cy="5" r="1" fill="#2ab3b8" opacity="0.2" />
      {/* نقطه زعفران */}
      <circle cx="2" cy="2" r="1" fill="#e67e22" opacity="0.3" />
    </svg>
  )
}

// تزئین هدر پنل ایرانی — برای section-title
export function SectionOrnamet({ className = '' }: DecorationProps) {
  return (
    <svg className={`inline-block ${className}`} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* لوزی ایرانی */}
      <path d="M8 1L15 8L8 15L1 8Z" stroke="#2ab3b8" strokeWidth="1" opacity="0.4" fill="none" />
      <path d="M8 4L12 8L8 12L4 8Z" fill="#1a4a8a" opacity="0.1" />
      <circle cx="8" cy="8" r="1.5" fill="#2ab3b8" opacity="0.5" />
    </svg>
  )
}

// خط جداکننده با نشانه ایرانی
export function IranianDivider({ text = '✦', className = '' }: DecorationProps & { text?: string }) {
  return (
    <div className={`divider-iranian ${className}`}>
      <span className="divider-iranian-text">{text}</span>
    </div>
  )
}

// پترن پس‌زمینه هندسی ایرانی برای کارت‌ها
export function GeometricBg({ className = '' }: DecorationProps) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="geo-bg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          {/* گره هشت ضلعی */}
          <path d="M20 0L28 8L40 8L40 20L32 28L32 40L20 40L12 32L0 32L0 20L8 12L8 0Z"
            fill="none" stroke="#1a4a8a" strokeWidth="0.4" opacity="0.12" />
          <circle cx="20" cy="20" r="3" fill="none" stroke="#2ab3b8" strokeWidth="0.3" opacity="0.1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geo-bg)" />
    </svg>
  )
}
