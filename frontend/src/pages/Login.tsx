import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Eye, EyeOff, MessageSquare, Smartphone, ArrowLeft, Sparkles } from 'lucide-react'
import { login as apiLogin } from '../services/api'
import { toPersianDigits } from '../utils/jalali'
import Button from '../components/Button'
import NeuralAnimation from '../components/NeuralAnimation'
import NeuralPattern from '../components/NeuralPattern'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.15 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 80, damping: 18 },
  },
} as const

const cardVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 70, damping: 20, delay: 0.05 },
  },
} as const

export default function Login() {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [shake, setShake] = useState<boolean>(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [twoFactor, setTwoFactor] = useState<{ requires_2fa: boolean; method?: string; phone?: string } | null>(null)
  const [otpCode, setOtpCode] = useState<string>('')
  const [otpTimer, setOtpTimer] = useState<number>(0)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (otpTimer <= 0) return
    const t = setInterval(() => setOtpTimer(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [otpTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setLoading(true)
    try {
      await login(username, password)
      navigate('/dashboard')
      toast.success('سلام! به پنل مدیریت کلینیک خوش اومدید')
    } catch (err: any) {
      const data = err.response?.data
      if (data?.requires_2fa) {
        setTwoFactor(data)
        setOtpTimer(180)
        return
      }
      toast.error(data?.detail || 'متأسفانه نام کاربری یا رمز عبور اشتباه است ')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode) return
    setLoading(true)
    try {
      await login(username, password, otpCode)
      navigate('/dashboard')
      toast.success('ورود شما با موفقیت انجام شد')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'متأسفانه کد تایید اشتباه است ')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    try {
      await apiLogin(username, password)
      toast.success('کد تأیید جدید برای شما ارسال شد')
      setOtpTimer(180)
      setOtpCode('')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'متأسفانه در ارسال مجدد کد مشکلی پیش اومد ')
    } finally {
      setLoading(false)
    }
  }

  if (twoFactor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(37,99,235,0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(37,99,235,0.03) 0%, transparent 50%)',
        }} />
        <NeuralPattern />
        <motion.div
          className="relative z-10 w-full max-w-[440px] p-5"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
        >
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl px-10 py-12 border border-white/50 shadow-xl shadow-brand-500/5">
            {twoFactor.method === 'totp' ? (
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <Smartphone className="text-white" size={30} />
              </motion.div>
            ) : (
              <motion.div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-brand-500/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <MessageSquare className="text-white" size={30} />
              </motion.div>
            )}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-extrabold text-slate-800">تایید دو مرحله‌ای</h2>
              <p className="text-sm text-slate-400 mt-2">{twoFactor.method === 'totp' ? 'کد ۶ رقمی Google Authenticator را وارد کنید' : `کد تایید به شماره ${twoFactor.phone} ارسال شد`}</p>
            </motion.div>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">کد تایید</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold bg-slate-50/80 border-2 border-slate-200 rounded-2xl text-slate-800 outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  inputMode="numeric"
                  placeholder="••••••"
                  autoFocus
                />
              </motion.div>
              {otpTimer > 0 && (
                <motion.div
                  className="flex items-center justify-center gap-2 bg-amber-50/80 text-amber-700 text-sm font-bold px-4 py-2.5 rounded-2xl border border-amber-200/60 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{toPersianDigits(String(Math.floor(otpTimer / 60)).padStart(2, '0'))}:{toPersianDigits(String(otpTimer % 60).padStart(2, '0'))}</span>
                  <span className="text-xs font-normal text-amber-500">تا انقضای کد</span>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full !py-3.5 !text-base !font-bold !rounded-2xl"
                  loading={loading}
                  disabled={otpCode.length < (twoFactor.method === 'totp' ? 6 : 4)}
                  size="lg"
                >
                  تایید
                </Button>
              </motion.div>
              <motion.div
                className="flex flex-col items-center gap-3 pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <button type="button" onClick={handleResendOtp} disabled={loading || otpTimer > 0}
                  className="text-sm text-brand-500 hover:text-brand-600 font-semibold bg-transparent border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  ارسال مجدد کد
                </button>
                <button type="button" onClick={() => { setTwoFactor(null); setOtpCode('') }}
                  className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer transition-colors">
                  <ArrowLeft size={13} /> بازگشت به صفحه ورود
                </button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease; }
      `}</style>

      <NeuralAnimation />

      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(ellipse at 15% 50%, rgba(37,99,235,0.05) 0%, transparent 55%), radial-gradient(ellipse at 85% 50%, rgba(37,99,235,0.03) 0%, transparent 50%)',
      }} />

      <NeuralPattern />

      {/* Left Brand Panel */}
      <motion.div
        className="hidden lg:flex lg:w-[45%] relative items-center justify-center overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
          backgroundSize: '30px 30px',
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 40% 30%, rgba(96,165,250,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(37,99,235,0.08) 0%, transparent 50%)',
        }} />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="w-full h-full opacity-[0.04]" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="neuro" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="1.5" fill="white" opacity="0.5" />
                <line x1="40" y1="40" x2="80" y2="40" stroke="white" strokeWidth="0.3" opacity="0.3" />
                <line x1="40" y1="40" x2="40" y2="80" stroke="white" strokeWidth="0.3" opacity="0.3" />
                <line x1="40" y1="40" x2="0" y2="40" stroke="white" strokeWidth="0.3" opacity="0.3" />
                <line x1="40" y1="40" x2="40" y2="0" stroke="white" strokeWidth="0.3" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="600" height="800" fill="url(#neuro)" />
          </svg>
        </div>

        <motion.div
          className="relative z-10 text-center px-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <motion.div
            className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl mx-auto mb-8 flex items-center justify-center border border-white/10 shadow-2xl shadow-black/10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.3 }}
          >
            <Sparkles className="text-white/90" size={38} />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight" style={{ letterSpacing: '-0.5px' }}>
            کلینیک تخصصی
          </h1>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight" style={{ letterSpacing: '-0.5px' }}>
            اعصاب و روان
          </h2>
          <div className="w-16 h-1 bg-gradient-to-l from-brand-400 via-blue-300 to-white/60 rounded-full mx-auto mb-5" />
          <p className="text-lg text-blue-200/80 font-medium">دکتر محمد طاهری</p>
          <p className="text-sm text-blue-300/50 mt-3 max-w-xs mx-auto leading-relaxed">
            مسیر بهبودی آرامش و سلامت روان
          </p>
        </motion.div>

        <motion.div
          className="absolute bottom-10 left-0 right-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs text-white/15 font-medium tracking-wide">
            سامانه مدیریت جامع کلینیک
          </p>
        </motion.div>
      </motion.div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-[55%] min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50/30 relative">
        <motion.div
          className="w-full max-w-[440px] p-6 md:p-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="bg-white/80 backdrop-blur-2xl rounded-3xl px-8 md:px-10 py-10 md:py-12 border border-white/40 shadow-xl shadow-brand-500/5"
            variants={cardVariants}
          >
            {/* Mobile Logo (shown only on small screens) */}
            <motion.div
              className="lg:hidden flex items-center justify-center gap-3 mb-8"
              variants={itemVariants}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
                <Sparkles className="text-white" size={20} />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">کلینیک اعصاب و روان</p>
                <p className="text-[11px] text-slate-400 font-medium">دکتر محمد طاهری</p>
              </div>
            </motion.div>

            <motion.div className="text-center mb-8" variants={itemVariants}>
              <h2 className="text-2xl font-extrabold text-slate-800" style={{ letterSpacing: '-0.5px' }}>خوش آمدید</h2>
              <p className="text-sm text-slate-400 mt-1.5 font-medium">لطفاً برای ورود اطلاعات خود را وارد کنید</p>
            </motion.div>

            <motion.div className="h-[2px] w-14 bg-gradient-to-l from-brand-500 to-brand-300 rounded-full mx-auto mb-8" variants={itemVariants} />

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div className="relative" variants={itemVariants}>
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 z-[2] pointer-events-none transition-all duration-300 ${focusedField === 'username' || username ? 'text-brand-500' : 'text-slate-400'}`}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3.5 pr-[50px] border-2 border-slate-200/80 rounded-2xl bg-slate-50/60 text-slate-800 text-sm font-medium outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400/60"
                  placeholder="نام کاربری"
                  autoFocus
                />
              </motion.div>

              <motion.div className="relative" variants={itemVariants}>
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 z-[2] pointer-events-none transition-all duration-300 ${focusedField === 'password' || password ? 'text-brand-500' : 'text-slate-400'}`}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3.5 pr-[50px] pl-[50px] border-2 border-slate-200/80 rounded-2xl bg-slate-50/60 text-slate-800 text-sm font-medium outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400/60"
                  placeholder="رمز عبور"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer p-1 z-[2] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </motion.div>



              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  variant="gradient"
                  className={`w-full !py-3.5 !text-base !font-bold !rounded-2xl !shadow-lg !shadow-brand-500/20 hover:!shadow-xl hover:!shadow-brand-500/30 ${shake ? 'animate-shake' : ''}`}
                  loading={loading}
                  size="lg"
                >
                  ورود به سامانه
                </Button>
              </motion.div>
            </form>

            <motion.div className="mt-6 text-center" variants={itemVariants}>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 no-underline hover:text-brand-500 transition-colors"
              >
                رمز عبور را فراموش کرده‌اید؟
              </Link>
            </motion.div>


          </motion.div>


        </motion.div>
      </div>
    </div>
  )
}
