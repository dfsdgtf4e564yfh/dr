import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getFinancialReport, getFinancialReportPdf, getMonthlyIncome, getClinicSettings } from '../services/api'
import { toPersianDigits, formatMoney, nowJalali } from '../utils/jalali'

export default function BillingReport() {
  const [report, setReport] = useState<any>(null)
  const [monthlyIncome, setMonthlyIncome] = useState<any[]>([])
  const [period, setPeriod] = useState<string>('monthly')
  const [loading, setLoading] = useState<boolean>(true)
  const [printCount, setPrintCount] = useState<number>(parseInt(localStorage.getItem('billingPrintCount') || '0'))
  const [clinicName, setClinicName] = useState<string>('')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getClinicSettings().then(({ data }: any) => {
      const s = Array.isArray(data) ? data[0] : data
      if (s && s.clinic_name) setClinicName(s.clinic_name)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getFinancialReport({ period }),
      getMonthlyIncome(),
    ]).then(([r, mi]: any[]) => {
      setReport(r.data)
      setMonthlyIncome(Array.isArray(mi.data) ? mi.data : mi.data?.results || [])
    }).catch(() => toast.error('متأسفانه در دریافت گزارش خطایی رخ داد '))
      .finally(() => setLoading(false))
  }, [period])

  const handlePrint = () => {
    const el = printRef.current
    if (!el) return
    const win = window.open('', '', 'width=1000,height=700')
    const today = nowJalali()
    const clinic = clinicName || 'کلینیک'
    win!.document.write('<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>گزارش مالی</title>')
    win!.document.write(`
<style>
  @page { margin: 1.5cm 1.2cm; size: A4; }
  @font-face { font-family: 'Vazirmatn'; font-weight: 300; src: url('/fonts/webfonts/Vazirmatn-Light.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 400; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 700; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); }
  @font-face { font-family: 'Vazirmatn'; font-weight: 900; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Vazirmatn', Tahoma, sans-serif; background: #fff; color: #1e293b; font-size: 11px; line-height: 1.7; }
  .print-frame { border: 2px solid #000; padding: 24px; }

  .brand { text-align: center; padding-bottom: 14px; margin-bottom: 16px; position: relative; }
  .brand::after { content: ''; position: absolute; bottom: 0; right: 30%; left: 30%; height: 1px; background: linear-gradient(90deg, transparent, #94a3b8, transparent); }
  .brand h1 { font-size: 18px; font-weight: 700; color: #1e3a5f; letter-spacing: 1px; }
  .brand .sub { font-size: 9px; color: #64748b; font-weight: 300; }

  .meta-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; }
  .meta-row .period-label { background: #f1f5f9; color: #475569; padding: 3px 12px; border-radius: 12px; font-weight: 700; font-size: 8px; }

  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-card { border: 1px solid #e2e8f0; border-radius: 2px; padding: 14px 16px; text-align: center; }
  .stat-card .sc-label { font-size: 8px; color: #94a3b8; font-weight: 400; text-transform: uppercase; letter-spacing: 1px; }
  .stat-card .sc-value { font-size: 18px; font-weight: 900; margin-top: 4px; }
  .stat-card .sc-unit { font-size: 8px; color: #94a3b8; margin-top: 2px; }
  .stat-card.sc-income .sc-value { color: #1e3a5f; }
  .stat-card.sc-paid .sc-value { color: #0f766e; }
  .stat-card.sc-pending .sc-value { color: #991b1b; }

  .section-title { font-size: 10px; font-weight: 700; color: #1e3a5f; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; align-items: center; gap: 6px; }
  .section-title .num { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; background: #1e3a5f; color: #fff; border-radius: 50%; font-size: 7px; font-weight: 700; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead th { background: #f8fafc; color: #475569; font-size: 8px; font-weight: 700; padding: 7px 10px; text-align: right; border-bottom: 1px solid #e2e8f0; }
  tbody td { padding: 6px 10px; font-size: 10px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  tbody tr:last-child td { border-bottom: none; }

  .text-center { text-align: center; }
  .empty-state { padding: 24px; text-align: center; color: #cbd5e1; font-size: 10px; }

  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8px; color: #cbd5e1; }
  .footer .sig-row { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #d1d5db; }
  .footer .sig-item { text-align: center; min-width: 120px; }
  .footer .sig-item .line { width: 100px; border-top: 1px solid #94a3b8; margin: 0 auto 6px; }
  .footer .sig-item .label { font-size: 8px; color: #94a3b8; }

  @media print { body { padding: 0; } }
</style></head><body>
`)
    win!.document.write(`<div class="print-frame">
<div class="brand">
  <h1>${clinic}</h1>
  <div class="sub">گزارش مالی — صورت‌های مالی و درآمدی</div>
</div>`)
    const periodLabel = period === 'daily' ? 'روزانه' : period === 'weekly' ? 'هفتگی' : period === 'monthly' ? 'ماهانه' : 'سالانه'
    win!.document.write(`<div class="meta-row">
  <span>تاریخ چاپ: ${today}</span>
  <span class="period-label">دوره: ${periodLabel}</span>
</div>`)
    win!.document.write(`<div class="stats-grid">
  <div class="stat-card sc-income">
    <div class="sc-label">درآمد کل</div>
    <div class="sc-value">${formatMoney(report?.total_income)}</div>
    <div class="sc-unit">تومان</div>
  </div>
  <div class="stat-card sc-paid">
    <div class="sc-label">دریافت شده</div>
    <div class="sc-value">${formatMoney(report?.total_paid)}</div>
    <div class="sc-unit">تومان</div>
  </div>
  <div class="stat-card sc-pending">
    <div class="sc-label">مانده حساب</div>
    <div class="sc-value">${formatMoney(report?.total_pending)}</div>
    <div class="sc-unit">تومان</div>
  </div>
</div>`)
    const hasDoctors = report?.doctor_incomes?.length > 0
    if (hasDoctors) {
      win!.document.write(`<div class="section-title"><span class="num">۱</span> درآمد پزشکان</div>
  <table>
    <thead><tr>
      <th>پزشک / درمانگر</th>
      <th>درآمد کل</th>
      <th>دریافت شده</th>
      <th>سهم پزشک / درمانگر</th>
    </tr></thead>
    <tbody>
`)
      report.doctor_incomes.forEach((d: any) => {
        win!.document.write(`      <tr>
        <td style="font-weight:700">${d.doctor_name}</td>
        <td>${formatMoney(d.total)} تومان</td>
        <td>${formatMoney(d.paid)} تومان</td>
        <td>${formatMoney(d.share)} تومان</td>
      </tr>
`)
      })
      win!.document.write(`    </tbody>
  </table>`)
    } else {
      win!.document.write(`<div class="empty-state">اطلاعاتی برای نمایش وجود ندارد</div>`)
    }
    win!.document.write(`<div class="footer">
  <div>این گزارش توسط سیستم مدیریت کلینیک ${clinic} تهیه شده است</div>
  <div class="sig-row">
    <div class="sig-item"><div class="line"></div><div class="label">امضا و مهر</div></div>
    <div class="sig-item"><div class="line"></div><div class="label">امضا و مهر</div></div>
  </div>
</div>`)
    win!.document.write('</div></body></html>')
    win!.document.close()
    setTimeout(() => { win!.print() }, 500)
    const newCount = printCount + 1
    setPrintCount(newCount)
    localStorage.setItem('billingPrintCount', newCount.toString())
  }

  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">گزارش مالی</h1>
        <button onClick={handlePrint} className="btn-secondary">چاپ گزارش {printCount > 0 && `(${toPersianDigits(printCount)})`}</button>
        <button onClick={() => {
          getFinancialReportPdf({ period }).then(({ data }: any) => {
            const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
            window.open(url)
          }).catch(() => toast.error('خطا در دریافت PDF'))
        }} className="btn-secondary">PDF</button>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium">دوره:</span>
          {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm ${period === p ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p === 'daily' ? 'روزانه' : p === 'weekly' ? 'هفتگی' : p === 'monthly' ? 'ماهانه' : 'سالانه'}
            </button>
          ))}
        </div>
      </div>

      <div ref={printRef}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">درآمد کل</p>
            <p className="text-2xl font-bold text-blue-600">{formatMoney(report?.total_income)}</p>
            <p className="text-xs text-gray-400">تومان</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">دریافت شده</p>
            <p className="text-2xl font-bold text-green-600">{formatMoney(report?.total_paid)}</p>
            <p className="text-xs text-gray-400">تومان</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">مانده</p>
            <p className={`text-2xl font-bold ${report?.total_pending > 0 ? 'text-red-600' : 'text-gray-600'}`}>{formatMoney(report?.total_pending)}</p>
            <p className="text-xs text-gray-400">تومان</p>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold mb-4">درآمد ماهانه</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyIncome}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={(m: number) => monthNames[m - 1]} />
              <YAxis tickFormatter={(v: number) => formatMoney(v)} />
              <Tooltip formatter={(v: number) => `${formatMoney(v)} تومان`} />
              <Bar dataKey="total" name="درآمد کل" fill="#3B82F6" radius={[4,4,0,0]} />
              <Bar dataKey="paid" name="دریافت شده" fill="#10B981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-bold mb-4">درآمد پزشکان</h3>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-600">
              <th className="text-center py-2 px-2">پزشک / درمانگر</th>
              <th className="text-center py-2 px-2">درآمد کل</th>
              <th className="text-center py-2 px-2">دریافت شده</th>
              <th className="text-center py-2 px-2">سهم پزشک / درمانگر</th>
            </tr></thead>
            <tbody>
              {report?.doctor_incomes?.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-gray-400">اطلاعاتی موجود نیست</td></tr>
              ) : report?.doctor_incomes?.map((d: any, idx: number) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">{d.doctor_name}</td>
                  <td className="py-2 px-2">{formatMoney(d.total)}</td>
                  <td className="py-2 px-2">{formatMoney(d.paid)}</td>
                  <td className="py-2 px-2">{formatMoney(d.share)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}
