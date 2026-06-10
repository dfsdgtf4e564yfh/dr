import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { getDoctorBalances, getFinancialReport } from '../services/api'
import { toPersianDigits, formatMoney } from '../utils/jalali'
import { useAuth } from '../contexts/AuthContext'
import { Wallet, TrendingUp, TrendingDown, DollarSign, UserCircle, HandCoins } from 'lucide-react'
import type { User } from '../types'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export default function DoctorFinance() {
  const [balances, setBalances] = useState<any[]>([])
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    Promise.all([
      getDoctorBalances(),
      getFinancialReport({ period: 'monthly' }),
    ]).then(([b, r]) => {
      setBalances(Array.isArray(b.data) ? b.data : b.data?.results || [])
      setReport(r.data)
    }).catch(() => toast.error('متأسفانه خطایی رخ داد '))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        <span className="text-sm text-surface-400">در حال بارگذاری...</span>
      </div>
    </div>
  )

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-surface-800">حساب پزشکان</h1>
          <p className="text-sm text-surface-400 mt-1">مدیریت مالی و تسویه حساب پزشکان کلینیک</p>
        </div>
      </div>

      {((user as User).role === 'doctor' || (user as User).role === 'psychologist') && (
        <div className="bg-info-50 border border-info-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-info-100 text-info-500 flex items-center justify-center shrink-0">
            <UserCircle size={18} />
          </div>
          <p className="text-sm text-info-700 font-medium">شما فقط می‌توانید اطلاعات مربوط به خود را مشاهده کنید.</p>
        </div>
      )}

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {balances.map((b, idx) => (
          <motion.div key={idx} variants={item} className="card p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-surface-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-sm">
                <UserCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-surface-800">{b.doctor_name}</h3>
                <span className="text-xs text-surface-400">پزشک کلینیک</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-50/70">
                <span className="text-xs text-surface-500 font-medium flex items-center gap-1.5">
                  <DollarSign size={14} className="text-brand-500" /> سهم ویزیت
                </span>
                <span className="text-sm font-bold text-brand-600">{formatMoney(b.visit_share)} تومان</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-surface-50/70">
                <span className="text-xs text-surface-500 font-medium flex items-center gap-1.5">
                  <HandCoins size={14} className="text-success-500" /> سهم خدمات
                </span>
                <span className="text-sm font-bold text-success-600">{formatMoney(b.service_share)} تومان</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-brand-50/50 border border-brand-100">
                <span className="text-xs font-bold text-surface-600">مجموع سهم</span>
                <span className="text-sm font-extrabold text-surface-800">{formatMoney(b.total_share)} تومان</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-success-50/50">
                <span className="text-xs text-surface-500 font-medium flex items-center gap-1.5">
                  <TrendingDown size={14} className="text-success-500" /> تسویه شده
                </span>
                <span className="text-sm font-bold text-success-600">{formatMoney(b.total_settled)} تومان</span>
              </div>
              <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-surface-100">
                <span className="text-sm font-bold text-surface-700">مانده حساب</span>
                <span className={`text-base font-extrabold ${b.balance > 0 ? 'text-warning-600' : 'text-success-600'}`}>
                  {formatMoney(b.balance)} تومان
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {(user as User).role !== 'doctor' && (
      <motion.div variants={item} className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-warning-50 text-warning-500 flex items-center justify-center">
            <Wallet size={18} />
          </div>
          <div>
            <h3 className="font-bold text-surface-800">درآمد پزشکان (ماه جاری)</h3>
            <p className="text-xs text-surface-400">گزارش عملکرد مالی پزشکان</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th className="text-right">پزشک</th>
                <th className="text-right">درآمد کل</th>
                <th className="text-right">دریافت شده</th>
                <th className="text-right">سهم پزشک</th>
              </tr></thead>
              <tbody>
                {report?.doctor_incomes?.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-surface-400">اطلاعاتی ثبت نشده</td></tr>
                ) : report?.doctor_incomes?.map((d: any, idx: number) => (
                  <tr key={idx}>
                    <td className="font-semibold text-surface-700">{d.doctor_name}</td>
                    <td className="font-bold text-surface-800">{formatMoney(d.total)}</td>
                    <td className="text-success-600 font-semibold">{formatMoney(d.paid)}</td>
                    <td className="text-brand-600 font-bold">{formatMoney(d.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
      )}
    </motion.div>
  )
}
