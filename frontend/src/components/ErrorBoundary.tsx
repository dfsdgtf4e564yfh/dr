import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
          <div className="bg-white/95 rounded-2xl border border-red-200/60 shadow-soft-lg p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-red-50 mx-auto mb-5 flex items-center justify-center">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">خطایی رخ داده است</h2>
            <p className="text-sm text-slate-500 mb-2">متأسفانه در اجرای این بخش مشکلی پیش آمده است.</p>
            {this.props.fallback}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-bold text-sm hover:bg-brand-600 transition-all shadow-md shadow-brand-500/20 mt-4 border-none cursor-pointer"
            >
              <RefreshCw size={16} />
              تلاش مجدد
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
