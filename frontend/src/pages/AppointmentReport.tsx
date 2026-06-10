import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { FileBarChart, Printer } from 'lucide-react'
import { getAppointmentReport } from '../services/api'
import { getDoctors } from '../services/api'
import { toJalali, toPersianDigits } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'

export default function AppointmentReport() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [printCount, setPrintCount] = useState<number>(() => parseInt(localStorage.getItem('printCount') || '0'))
  const [doctors, setDoctors] = useState<any[]>([])
  const [filters, setFilters] = useState<any>({ date_from: '', date_to: '', doctor: '', status: '' })
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getDoctors().then(({ data }: any) => setDoctors(Array.isArray(data) ? data : data.results || [])).catch(() => {})
  }, [])

  const loadReport = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (filters.doctor) params.doctor = filters.doctor
      if (filters.status) params.status = filters.status
      const { data } = await getAppointmentReport(params)
      setReport(data)
    } catch { toast.error('متأسفانه در دریافت گزارش خطایی رخ داد ') }
    finally { setLoading(false) }
  }

  const handlePrint = () => {
    const newCount = printCount + 1
    setPrintCount(newCount)
    localStorage.setItem('printCount', newCount.toString())
    const win = window.open('', '', 'width=1000,height=700')
    const statusMap: Record<string, string> = { completed: 'انجام شده', cancelled: 'لغو شده', scheduled: 'نوبت‌گذاری شده', rescheduled: 'تغییر یافته' }
    const rows = (report?.appointments || []).map((a: any) => `
      <tr>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:right;font-size:11px;color:#1e293b">${a.patient_name}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:right;font-size:11px;color:#1e293b">${a.doctor_name}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center;font-size:11px;color:#1e293b;font-weight:700">${toJalali(a.date)}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center;font-size:11px;color:#1e293b">${a.time}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center;font-size:11px">
          <span style="display:inline-block;padding:2px 8px;font-size:8px;font-weight:700;${
            a.status === 'completed' ? 'color:#0f766e' :
            a.status === 'cancelled' ? 'color:#991b1b' :
            a.status === 'scheduled' ? 'color:#1e3a5f' : 'color:#92400e'
          }">${statusMap[a.status]}</span>
        </td>
      </tr>
    `).join('')

    const todayJ = toJalali(new Date().toISOString().split('T')[0])

    win!.document.write(`<html dir="rtl"><head><title>گزارش نوبت‌ها</title>
    <style>
      @page { size: A4; margin: 1cm; }
      @font-face { font-family: 'Vazirmatn'; font-weight: 300; src: url('/fonts/webfonts/Vazirmatn-Light.woff2') format('woff2'); }
      @font-face { font-family: 'Vazirmatn'; font-weight: 400; src: url('/fonts/webfonts/Vazirmatn-Medium.woff2') format('woff2'); }
      @font-face { font-family: 'Vazirmatn'; font-weight: 700; src: url('/fonts/webfonts/Vazirmatn-Bold.woff2') format('woff2'); }
      @font-face { font-family: 'Vazirmatn'; font-weight: 900; src: url('/fonts/webfonts/Vazirmatn-ExtraBold.woff2') format('woff2'); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; font-size: 10px; color: #1e293b; line-height: 1.8; }
      .print-frame { border: 2px solid #000; padding: 20px; min-height: 100%; }
      .brand { text-align: center; padding-bottom: 12px; margin-bottom: 16px; position: relative; }
      .brand::after { content: ''; position: absolute; bottom: 0; right: 30%; left: 30%; height: 1px; background: linear-gradient(90deg, transparent, #94a3b8, transparent); }
      .brand h1 { font-size: 16px; font-weight: 700; color: #1e3a5f; letter-spacing: 1px; }
      .brand .sub { font-size: 9px; color: #64748b; font-weight: 300; }
      .brand .date-badge { display: inline-block; margin-top: 4px; padding: 2px 12px; background: #f1f5f9; color: #475569; font-size: 8px; font-weight: 700; border-radius: 10px; }
      .stats-row { display: flex; gap: 10px; margin-bottom: 18px; }
      .stat-box { flex: 1; border: 1px solid #e2e8f0; padding: 10px; text-align: center; background: #fafafa; }
      .stat-box .num { font-size: 20px; font-weight: 900; line-height: 1.2; }
      .stat-box .lbl { font-size: 8px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
      table { width: 100%; border-collapse: collapse; }
      thead th { background: #f8fafc; color: #475569; padding: 6px 8px; font-size: 8px; font-weight: 700; text-align: right; border-bottom: 1px solid #e2e8f0; }
      tbody td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; font-size: 9px; color: #334155; }
      tbody tr:last-child td { border-bottom: none; }
      .footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8px; color: #cbd5e1; }
      @media print { body { margin: 0; padding: 0; } .print-frame { border: 2px solid #000; padding: 20px; } }
    </style></head>
    <body>
      <div class="print-frame">
        <div class="brand">
          <h1>مطب تخصصی دکتر محمد طاهری</h1>
          <div class="sub">کلینیک تخصصی مغز و اعصاب و روان — گزارش نوبت‌ها</div>
          <div class="date-badge">تاریخ گزارش: ${todayJ}</div>
        </div>
        <div class="stats-row">
          <div class="stat-box">
            <div class="num" style="color:#1e3a5f">${toPersianDigits(report?.total || 0)}</div>
            <div class="lbl">کل نوبت‌ها</div>
          </div>
          <div class="stat-box">
            <div class="num" style="color:#0f766e">${toPersianDigits(report?.by_status?.completed || 0)}</div>
            <div class="lbl">انجام شده</div>
          </div>
          <div class="stat-box">
            <div class="num" style="color:#991b1b">${toPersianDigits(report?.by_status?.cancelled || 0)}</div>
            <div class="lbl">لغو شده</div>
          </div>
          <div class="stat-box">
            <div class="num" style="color:#1e3a5f">${toPersianDigits(report?.by_status?.scheduled || 0)}</div>
            <div class="lbl">نوبت‌گذاری شده</div>
          </div>
        </div>
        <table>
          <thead><tr>
            <th style="text-align:right">بیمار</th>
            <th style="text-align:right">پزشک</th>
            <th style="text-align:center">تاریخ</th>
            <th style="text-align:center">ساعت</th>
            <th style="text-align:center">وضعیت</th>
          </tr></thead>
          <tbody>
            ${rows || '<tr><td colspan="5" style="text-align:center;padding:16px;color:#cbd5e1;font-size:9px">نوبتی یافت نشد</td></tr>'}
          </tbody>
        </table>
        <div class="footer">این گزارش توسط سامانه مدیریت کلینیک دکتر طاهری تهیه شده است</div>
      </div>
    </body></html>`)
    win!.document.close()
    win!.print()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">گزارش نوبت‌ها</h1>
        <button onClick={handlePrint} className="btn-secondary flex items-center gap-2" disabled={!report}>
          <Printer size={16} /> چاپ گزارش <span className="text-xs text-slate-400">({toPersianDigits(printCount)})</span>
        </button>
      </div>

      <div className="panel card-iranian">
        <div className="panel-body">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]"><label className="label">از تاریخ</label><JalaliDateInput value={filters.date_from} onChange={v => setFilters({ ...filters, date_from: v })} /></div>
            <div className="flex-1 min-w-[160px]"><label className="label">تا تاریخ</label><JalaliDateInput value={filters.date_to} onChange={v => setFilters({ ...filters, date_to: v })} /></div>
            <div className="flex-1 min-w-[160px]"><label className="label">پزشک</label>
              <select className="input-field w-full" value={filters.doctor} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, doctor: e.target.value })}>
                <option value="">همه پزشکان</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]"><label className="label">وضعیت</label>
              <select className="input-field w-full" value={filters.status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">همه</option>
                <option value="scheduled">نوبت‌گذاری شده</option>
                <option value="completed">انجام شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>
            <button onClick={loadReport} className="btn-primary flex items-center gap-2 self-end py-2.5"><FileBarChart size={16} /> نمایش گزارش</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent" /></div>
      ) : report ? (
        <div ref={printRef} className="max-w-5xl mx-auto space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-xs text-slate-400">کل نوبت‌ها</p>
              <p className="text-2xl font-extrabold text-brand-500">{toPersianDigits(report.total)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-slate-400">انجام شده</p>
              <p className="text-2xl font-extrabold text-green-500">{toPersianDigits(report.by_status?.completed || 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-slate-400">لغو شده</p>
              <p className="text-2xl font-extrabold text-red-500">{toPersianDigits(report.by_status?.cancelled || 0)}</p>
            </div>
          </div>

          <div className="panel card-iranian">
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th className="text-right">بیمار</th>
                  <th className="text-right">پزشک</th>
                  <th className="text-center">تاریخ</th>
                  <th className="text-center">ساعت</th>
                  <th className="text-center">وضعیت</th>
                </tr></thead>
                <tbody>
                  {report.appointments?.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400">نوبتی یافت نشد</td></tr>
                  ) : report.appointments?.map((a: any) => (
                    <tr key={a.id}>
                      <td className="text-right">{a.patient_name}</td>
                      <td className="text-right">{a.doctor_name}</td>
                      <td className="text-center font-bold">{toJalali(a.date)}</td>
                      <td className="text-center">{a.time}</td>
                      <td className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          a.status === 'completed' ? 'bg-green-100 text-green-700' :
                          a.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          a.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {a.status === 'completed' ? 'انجام شده' : a.status === 'cancelled' ? 'لغو شده' : a.status === 'rescheduled' ? 'تغییر یافته' : 'نوبت‌گذاری شده'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-slate-400">
          <FileBarChart size={48} className="mx-auto text-slate-200 mb-3" />
          پارامترهای گزارش را وارد کنید
        </div>
      )}
    </div>
  )
}
