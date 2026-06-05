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
    <svg className={`inline-block ${className}`} width="80" height="16" viewBox="0 0 80 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 8H20M30 8H50M60 8H80" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M25 8C26.5 6 28.5 6 30 8C28.5 10 26.5 10 25 8Z" fill="#2563eb" opacity="0.15" />
      <path d="M55 8C56.5 6 58.5 6 60 8C58.5 10 56.5 10 55 8Z" fill="#2563eb" opacity="0.15" />
      <circle cx="40" cy="8" r="2" fill="#60a5fa" />
    </svg>
  )
}

export function StarDecoration({ className = '' }: DecorationProps) {
  return (
    <svg className={`inline-block ${className}`} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L12.2 7.2L18 8.2L13.8 12.6L15 18L10 15.2L5 18L6.2 12.6L2 8.2L7.8 7.2L10 2Z" fill="#2563eb" opacity="0.2" />
    </svg>
  )
}

export function EslimiMotif({ className = '' }: DecorationProps) {
  return (
    <svg className={`inline-block ${className}`} width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 20C10 10 20 10 30 20C40 30 50 30 60 20C70 10 80 10 90 20C100 30 110 30 120 20" stroke="#2563eb" strokeWidth="0.8" opacity="0.15" fill="none" />
      <path d="M0 20C10 25 20 25 30 20C40 15 50 15 60 20C70 25 80 25 90 20C100 15 110 15 120 20" stroke="#2563eb" strokeWidth="0.5" opacity="0.1" fill="none" />
      <circle cx="15" cy="20" r="2" fill="#2563eb" opacity="0.1" />
      <circle cx="45" cy="20" r="2" fill="#2563eb" opacity="0.1" />
      <circle cx="75" cy="20" r="2" fill="#2563eb" opacity="0.1" />
      <circle cx="105" cy="20" r="2" fill="#2563eb" opacity="0.1" />
    </svg>
  )
}

export function KhatamBorder({ className = '' }: DecorationProps) {
  return (
    <svg className={`inline-block ${className}`} width="100%" height="4" viewBox="0 0 200 4" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="2" x2="200" y2="2" stroke="#2563eb" strokeWidth="0.5" opacity="0.1" />
      <polygon points="10,2 15,0 20,2 15,4" fill="#2563eb" opacity="0.08" />
      <polygon points="30,2 35,0 40,2 35,4" fill="#2563eb" opacity="0.06" />
      <polygon points="50,2 55,0 60,2 55,4" fill="#2563eb" opacity="0.08" />
      <polygon points="70,2 75,0 80,2 75,4" fill="#2563eb" opacity="0.06" />
      <polygon points="90,2 95,0 100,2 95,4" fill="#2563eb" opacity="0.08" />
      <polygon points="110,2 115,0 120,2 115,4" fill="#2563eb" opacity="0.06" />
      <polygon points="130,2 135,0 140,2 135,4" fill="#2563eb" opacity="0.08" />
      <polygon points="150,2 155,0 160,2 155,4" fill="#2563eb" opacity="0.06" />
      <polygon points="170,2 175,0 180,2 175,4" fill="#2563eb" opacity="0.08" />
      <polygon points="190,2 195,0 200,2 195,4" fill="#2563eb" opacity="0.06" />
    </svg>
  )
}

export function TazhibCorner({ className = '' }: DecorationProps) {
  return (
    <svg className={`inline-block ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2H10C10 6.41828 6.41828 10 2 10V2Z" stroke="#2563eb" strokeWidth="0.8" opacity="0.15" fill="none" />
      <path d="M2 2L4 2M2 4L2 2" stroke="#2563eb" strokeWidth="0.5" opacity="0.1" />
      <circle cx="4" cy="4" r="1.5" fill="#2563eb" opacity="0.08" />
    </svg>
  )
}
