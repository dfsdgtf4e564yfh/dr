import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { Phone, Shield, KeyRound, ArrowRight, Check, Sparkles, Eye, EyeOff, User } from 'lucide-react'
import { toPersianDigits } from '../utils/jalali'
import OtpInput from '../components/OtpInput'
import { forgotPasswordSendOtp, forgotPasswordVerifyOtp, forgotPasswordReset } from '../services/api'
import Button from '../components/Button'

const STEPS = { PHONE: 1, OTP: 2, RESET: 3, DONE: 4 }

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

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  delay: number
  opacity: number
}

const NeuralPattern = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ng1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.07" />
        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.02" />
      </linearGradient>
      <linearGradient id="ng2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
      </linearGradient>
    </defs>
    <g fill="none" stroke="#2563eb" strokeWidth="0.5" opacity="0.08">
      <line x1="200" y1="100" x2="350" y2="250" />
      <line x1="350" y1="250" x2="550" y2="200" />
      <line x1="550" y1="200" x2="700" y2="350" />
      <line x1="700" y1="350" x2="900" y2="280" />
      <line x1="900" y1="280" x2="1050" y2="400" />
      <line x1="200" y1="100" x2="150" y2="300" />
      <line x1="150" y1="300" x2="350" y2="450" />
      <line x1="350" y1="450" x2="550" y2="400" />
      <line x1="550" y1="400" x2="700" y2="550" />
      <line x1="700" y1="550" x2="900" y2="480" />
      <line x1="900" y1="480" x2="1050" y2="600" />
      <line x1="200" y1="100" x2="400" y2="120" />
      <line x1="400" y1="120" x2="600" y2="80" />
      <line x1="600" y1="80" x2="800" y2="130" />
      <line x1="800" y1="130" x2="1000" y2="90" />
      <line x1="1050" y1="400" x2="1100" y2="250" />
      <line x1="150" y1="300" x2="80" y2="500" />
      <line x1="80" y1="500" x2="250" y2="650" />
      <line x1="250" y1="650" x2="450" y2="700" />
      <line x1="450" y1="700" x2="650" y2="620" />
      <line x1="650" y1="620" x2="850" y2="720" />
      <line x1="850" y1="720" x2="1050" y2="680" />
      <line x1="1050" y1="600" x2="1150" y2="720" />
      <line x1="200" y1="100" x2="300" y2="50" />
      <line x1="900" y1="280" x2="1050" y2="180" />
      <line x1="1050" y1="180" x2="1150" y2="250" />
      <line x1="350" y1="250" x2="250" y2="400" />
      <line x1="550" y1="200" x2="450" y2="380" />
      <line x1="700" y1="350" x2="600" y2="500" />
      <line x1="900" y1="280" x2="800" y2="450" />
    </g>
    <g fill="#2563eb">
      <circle cx="200" cy="100" r="2.5" opacity="0.12" />
      <circle cx="350" cy="250" r="2" opacity="0.10" />
      <circle cx="550" cy="200" r="2.5" opacity="0.12" />
      <circle cx="700" cy="350" r="2" opacity="0.10" />
      <circle cx="900" cy="280" r="2.5" opacity="0.12" />
      <circle cx="1050" cy="400" r="2" opacity="0.10" />
      <circle cx="150" cy="300" r="2" opacity="0.10" />
      <circle cx="350" cy="450" r="2.5" opacity="0.12" />
      <circle cx="550" cy="400" r="2" opacity="0.10" />
      <circle cx="700" cy="550" r="2.5" opacity="0.12" />
      <circle cx="900" cy="480" r="2" opacity="0.10" />
      <circle cx="1050" cy="600" r="2.5" opacity="0.12" />
      <circle cx="600" cy="80" r="2" opacity="0.10" />
      <circle cx="800" cy="130" r="2.5" opacity="0.12" />
      <circle cx="1000" cy="90" r="2" opacity="0.10" />
      <circle cx="1100" cy="250" r="2" opacity="0.08" />
      <circle cx="80" cy="500" r="2" opacity="0.10" />
      <circle cx="250" cy="650" r="2.5" opacity="0.12" />
      <circle cx="450" cy="700" r="2" opacity="0.10" />
      <circle cx="650" cy="620" r="2.5" opacity="0.12" />
      <circle cx="850" cy="720" r="2" opacity="0.10" />
      <circle cx="1050" cy="680" r="2" opacity="0.08" />
      <circle cx="300" cy="50" r="2" opacity="0.10" />
      <circle cx="1050" cy="180" r="2.5" opacity="0.12" />
      <circle cx="1150" cy="250" r="2" opacity="0.10" />
    </g>
  </svg>
)

const NeuralAnimation = () => {
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

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<number>(STEPS.PHONE)
  const [phone, setPhone] = useState<string>('')
  const [resetToken, setResetToken] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [otpError, setOtpError] = useState<string>('')
  const [otpCode, setOtpCode] = useState<string>('')
  const [resending, setResending] = useState<boolean>(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [otpTimer, setOtpTimer] = useState<number>(0)

  useEffect(() => {
    if (otpTimer <= 0) return
    const t = setInterval(() => setOtpTimer(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [otpTimer])

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!phone.trim()) {
      toast.error('لطفاً شماره موبایل خود را وارد کنید ')
      return
    }
    setLoading(true)
    setOtpError('')
    try {
      await forgotPasswordSendOtp(phone)
      toast.success('کد تأیید برای شماره شما ارسال شد')
      setOtpTimer(180)
      setStep(STEPS.OTP)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'متأسفانه در ارسال کد تأیید خطایی رخ داد ')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpComplete = async (code: string) => {
    setOtpCode(code)
    setLoading(true)
    setOtpError('')
    try {
      const { data } = await forgotPasswordVerifyOtp(phone, code) as { data: any }
      setResetToken(data.reset_token)
      setUsername(data.username)
      setFullName(data.full_name)
      toast.success('کد تأیید با موفقیت تأیید شد ')
      setStep(STEPS.RESET)
    } catch (err: any) {
      setOtpError(err.response?.data?.error || 'متأسفانه کد وارد شده اشتباه است ')
      setOtpCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setResending(true)
    try {
      await forgotPasswordSendOtp(phone)
      toast.success('کد تأیید جدید برای شما ارسال شد')
      setOtpTimer(180)
      setOtpCode('')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'متأسفانه خطایی رخ داد ')
    } finally {
      setResending(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد ')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('رمز عبور جدید و تکرار آن مطابقت ندارند ')
      return
    }
    setLoading(true)
    try {
      await forgotPasswordReset(phone, resetToken, newPassword)
      toast.success('رمز عبور شما با موفقیت تغییر کرد ')
      setStep(STEPS.DONE)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'متأسفانه خطایی رخ داد ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex">
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
            {/* Mobile Logo */}
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

            {/* Progress Steps */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-center gap-2 mb-8">
                {[STEPS.PHONE, STEPS.OTP, STEPS.RESET].map((s: number) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step >= s ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {step > s ? <Check size={14} /> : toPersianDigits(s)}
                    </div>
                    {s < STEPS.RESET && (
                      <div className={`w-8 h-0.5 rounded transition-all ${step > s ? 'bg-brand-500' : 'bg-slate-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {step === STEPS.PHONE && (
              <motion.div variants={itemVariants}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-brand-500/20">
                    <Phone className="text-white" size={28} />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-800">فراموشی رمز عبور</h2>
                  <p className="text-sm text-slate-400 mt-2">شماره موبایل خود را وارد کنید</p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="relative">
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 z-[2] pointer-events-none transition-all duration-300 ${focused === 'phone' || phone ? 'text-brand-500' : 'text-slate-400'}`}>
                      <Phone size={18} />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                      onFocus={() => setFocused('phone')}
                      onBlur={() => setFocused(null)}
                      className="w-full px-4 py-3.5 pr-[50px] border-2 border-slate-200/80 rounded-2xl bg-slate-50/60 text-slate-800 text-sm font-medium outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400/60"
                      placeholder="شماره موبایل"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full !py-3.5 !text-base !font-bold !rounded-2xl !shadow-lg !shadow-brand-500/20"
                    loading={loading}
                    size="lg"
                  >
                    ارسال کد تایید
                  </Button>
                </form>

                <motion.div className="mt-6 text-center" variants={itemVariants}>
                  <Link
                    to="/panel"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 no-underline hover:text-brand-500 transition-colors"
                  >
                    <ArrowRight size={14} /> بازگشت به صفحه ورود
                  </Link>
                </motion.div>
              </motion.div>
            )}

            {step === STEPS.OTP && (
              <motion.div variants={itemVariants}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-brand-500/20">
                    <Shield className="text-white" size={28} />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-800">کد تایید</h2>
                  <p className="text-sm text-slate-400 mt-2">
                    کد ارسال شده به {phone} را وارد کنید
                  </p>
                </div>

                <OtpInput
                  length={6}
                  onComplete={handleOtpComplete}
                  disabled={loading}
                  error={otpError}
                />

                {otpTimer > 0 && (
                  <div className="text-center mt-4">
                    <div className="inline-flex items-center gap-2 bg-amber-50/80 text-amber-700 text-sm font-bold px-4 py-2.5 rounded-2xl border border-amber-200/60">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>{toPersianDigits(String(Math.floor(otpTimer / 60)).padStart(2, '0'))}:{toPersianDigits(String(otpTimer % 60).padStart(2, '0'))}</span>
                      <span className="text-xs font-normal text-amber-500">تا انقضای کد</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-5">
                  <button
                    onClick={handleResendOtp}
                    disabled={resending || otpTimer > 0}
                    className="text-xs text-brand-500 hover:text-brand-600 bg-transparent border-none cursor-pointer font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {resending ? 'در حال ارسال...' : 'ارسال مجدد کد'}
                  </button>
                  <button
                    onClick={() => setStep(STEPS.PHONE)}
                    className="text-xs text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    تغییر شماره
                  </button>
                </div>
              </motion.div>
            )}

            {step === STEPS.RESET && (
              <motion.div variants={itemVariants}>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-brand-500/20">
                    <KeyRound className="text-white" size={28} />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-800">تغییر رمز عبور</h2>
                  <div className="bg-brand-50/80 rounded-2xl p-4 mt-4 text-center border border-brand-100/60">
                    <p className="text-xs text-slate-400">کاربر</p>
                    <p className="font-bold text-brand-600 text-lg">{fullName}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <User size={12} className="text-slate-400" />
                      <p className="text-xs text-slate-500 font-mono">{username}</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-3 font-medium">لطفاً رمز جدید خود را وارد کنید</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 z-[2] pointer-events-none transition-all duration-300 ${focused === 'password' || newPassword ? 'text-brand-500' : 'text-slate-400'}`}>
                      <KeyRound size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      className="w-full px-4 py-3.5 pr-[50px] pl-[50px] border-2 border-slate-200/80 rounded-2xl bg-slate-50/60 text-slate-800 text-sm font-medium outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400/60"
                      placeholder="رمز عبور جدید"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer p-1 z-[2] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="relative">
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 z-[2] pointer-events-none transition-all duration-300 ${focused === 'confirm' || confirmPassword ? 'text-brand-500' : 'text-slate-400'}`}>
                      <KeyRound size={18} />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocused('confirm')}
                      onBlur={() => setFocused(null)}
                      className="w-full px-4 py-3.5 pr-[50px] pl-[50px] border-2 border-slate-200/80 rounded-2xl bg-slate-50/60 text-slate-800 text-sm font-medium outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 placeholder:text-slate-400/60"
                      placeholder="تکرار رمز عبور جدید"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-slate-400 hover:text-slate-600 cursor-pointer p-1 z-[2] transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      variant="gradient"
                      className="w-full !py-3.5 !text-base !font-bold !rounded-2xl !shadow-lg !shadow-brand-500/20"
                      loading={loading}
                      size="lg"
                    >
                      تغییر رمز عبور
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === STEPS.DONE && (
              <motion.div variants={itemVariants}>
                <div className="text-center mb-8">
                  <motion.div
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-green-500/30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <Check size={36} className="text-white" />
                  </motion.div>
                  <h2 className="text-xl font-extrabold text-slate-800">رمز عبور تغییر کرد</h2>
                  <p className="text-sm text-slate-400 mt-2">رمز عبور شما با موفقیت تغییر یافت</p>
                </div>

                <Button
                  onClick={() => navigate('/panel')}
                  variant="gradient"
                  className="w-full !py-3.5 !text-base !font-bold !rounded-2xl !shadow-lg !shadow-brand-500/20"
                  size="lg"
                >
                  ورود به سامانه
                </Button>
              </motion.div>
            )}
          </motion.div>

          <motion.p
            className="text-center mt-6 text-[11px] text-slate-300 font-medium"
            variants={itemVariants}
          >
            سامانه مدیریت کلینیک اعصاب و روان
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
