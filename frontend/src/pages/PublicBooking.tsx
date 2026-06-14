import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Calendar, Clock, User, MapPin, CheckCircle, Stethoscope, ArrowRight, ArrowLeft, Shield, Phone, Star, GraduationCap, Award, Menu, X, Search, CheckSquare, CreditCard, Building2, Mail, Instagram, Youtube, BookOpen, BrainCircuit, Zap } from 'lucide-react'
import { getClinicInfo, getBookingServices, patientLookup, getAvailableTimes, createBooking, getHolidays } from '../services/api'
import { gregorianToJalali, jalaliToGregorian, toPersianDigits } from '../utils/jalali'
import JalaliDateInput from '../components/JalaliDateInput'

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
const WEEKDAYS_SHORT = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']
const TIME_SLOTS = ['16:00','16:10','16:30','16:50','17:10','17:30','17:50','18:10','18:30','18:50','19:10','19:30','19:50','20:10','20:30','20:50','21:10','21:30','21:50']



const DR_INFO = {
  name: 'دکتر محمد طاهری',
  specialty: 'متخصص اعصاب و روان (روانپزشک)',
  description: 'دکتر محمد طاهری از بهترین متخصصان اعصاب و روان و روانپزشک در بندرعباس می‌باشند. ایشان دارای ۱۸ سال سابقه فعالیت بعنوان روانپزشک (متخصص اعصاب و روان) در بندرعباس و بیمارستان‌های مختلف و سابقه عضویت در کمیسیون‌های پزشکی نیز هستند.',
  longBio: `دکتر محمد طاهری متخصص اعصاب و روان (روانپزشک)، دارای ۱۸ سال سابقه فعالیت در بندرعباس و بیمارستان‌های مختلف می‌باشند.

سابقه عضویت در کمیسیون‌های پزشکی
گواهی TMS از دانشگاه Maastricht هلند
سابقه تدریس روانپزشکی و روانشناسی در دانشگاه آزاد واحد بین‌الملل، دانشگاه آزاد`,
  address: 'بندر عباس، تقاطع رازی، سه راه پلنگ صورتی، پشت بانک صادرات، کوچه دوم جنب چاپخانه سپاهان',
  phone1: '07632220252',
  phone2: '07632229600',
  email: 'dr-mohammadtaheri@gmail.com',
  workHours: 'هر روز از ساعت ۱۶:۳۰ عصر تا ۲۲ - پنجشنبه‌ها تا ۲۱',
  instagram: 'http://instagram.com/dr_taheri_rtms',
}

const services_list = [
  { icon: Stethoscope, name: 'اعصاب و روان', desc: 'تشخیص و درمان انواع اختلالات روانپزشکی و عصبی' },
  { icon: BrainCircuit, name: 'نوروفیدبک', desc: 'روش نوین درمان با استفاده از بازخورد مغزی' },
  { icon: Zap, name: 'TMS', desc: 'تحریک مغناطیسی مغز با پیشرفته‌ترین دستگاه' },
]



export default function PublicBooking() {
  const [clinic, setClinic] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [heroLoaded, setHeroLoaded] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false)
  const [inquiryCodeInput, setInquiryCodeInput] = useState('')
  const [inquiryFileNumber, setInquiryFileNumber] = useState('')
  const [searchParams] = useSearchParams()
  const homeRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setTimeout(() => setHeroLoaded(true), 100) }, [])
  useEffect(() => {
    const payment = searchParams.get('payment')
    const tracking = searchParams.get('tracking')
    if (payment === 'success') toast.success(`پرداخت با موفقیت انجام شد. کد پیگیری: ${tracking || ''}`)
    else if (payment === 'failed') toast.error('پرداخت ناموفق بود. می‌توانید در مراجعه حضوری پرداخت کنید')
    else if (payment === 'cancelled') toast.warning('پرداخت لغو شد')
  }, [searchParams])
  useEffect(() => {
    getClinicInfo().then(({ data }) => setClinic(data)).catch(() => {})
    getBookingServices().then(({ data }) => setServices(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const scrollTo = (ref: any, section: string) => {
    setActiveSection(section)
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileMenu(false)
  }

  const handleInquiry = () => {
    if (inquiryCodeInput.length !== 10) { toast.error('کد ملی باید ۱۰ رقم باشد'); return }
    if (!inquiryFileNumber) { toast.error('شماره پرونده را وارد کنید'); return }
    setInquiryModalOpen(false)
    window.location.href = `/booking-inquiry/${inquiryCodeInput}?file_number=${inquiryFileNumber}`
  }

  const navItems = [
    { id: 'home', label: 'صفحه اصلی', ref: homeRef },
    { id: 'about', label: 'درباره دکتر', ref: aboutRef },
    { id: 'services', label: 'خدمات', ref: servicesRef },
    { id: 'book', label: 'نوبت‌دهی آنلاین', ref: bookRef, action: () => setTab('book') },
    { id: 'contact', label: 'تماس با ما', ref: contactRef },
  ]

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <style>{`
        @media print {
          body *:not([data-print]):not([data-print] *) { visibility: hidden !important; }
          [data-print] { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .text-gradient { background: linear-gradient(135deg, #1a4a8a, #2ab3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .spinner-iranian { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #1a4a8a; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/images/clinic/logo.png" alt="لوگو" className="h-9 w-9 rounded-xl object-cover" />
            <div>
              <span className="text-sm font-bold text-[#1a4a8a] block leading-tight">دکتر محمد طاهری</span>
              <span className="text-[10px] text-[#2ab3b8] font-medium">متخصص اعصاب و روان</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.ref, item.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${activeSection === item.id ? 'text-[#1a4a8a] bg-[#1a4a8a]/5' : 'text-gray-600 hover:text-[#1a4a8a] hover:bg-gray-50'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setInquiryModalOpen(true)} className="hidden sm:inline-flex text-xs font-bold text-[#1a4a8a] bg-[#1a4a8a]/5 px-4 py-2 rounded-xl hover:bg-[#1a4a8a]/10 transition-all items-center gap-1.5"><Search size={14} />استعلام نوبت</button>
            <a href="/panel" className="hidden sm:inline-flex text-xs font-bold text-white bg-gradient-to-l from-[#1a4a8a] to-[#2ab3b8] px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-[#1a4a8a]/20 transition-all">ورود پزشکان</a>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
            {navItems.map(item => (
              <button key={item.id} onClick={() => { item.action?.(); scrollTo(item.ref, item.id) }}
                className={`block w-full text-right px-3 py-2.5 rounded-lg text-sm transition-all ${activeSection === item.id ? 'text-[#1a4a8a] bg-[#1a4a8a]/5 font-bold' : 'text-gray-600 hover:text-[#1a4a8a]'}`}>
                {item.label}
              </button>
            ))}
            <button onClick={() => { setMobileMenu(false); setInquiryModalOpen(true) }} className="block w-full text-center text-sm font-bold text-[#1a4a8a] bg-[#1a4a8a]/5 px-4 py-2.5 rounded-xl mt-2">استعلام نوبت</button>
            <a href="/panel" onClick={() => setMobileMenu(false)} className="block text-center text-sm font-bold text-white bg-gradient-to-l from-[#1a4a8a] to-[#2ab3b8] px-4 py-2.5 rounded-xl mt-2">ورود پزشکان</a>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section ref={homeRef} className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f3a] via-[#1a4a8a] to-[#2ab3b8]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f3a]/40 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center pt-16 pb-24">
            <div className={`space-y-6 transition-all duration-700 delay-200 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/10">
                <Shield size={14} className="text-[#67e8f9]" />
                <span className="text-xs text-white/80 font-medium">نوبت‌دهی آنلاین تخصصی</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                {clinic?.doctor_name || 'دکتر محمد طاهری'}
              </h1>
              <p className="text-lg sm:text-xl text-[#67e8f9] font-bold">{clinic?.specialty || 'متخصص اعصاب و روان (روانپزشک)'}</p>
              <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-lg">
                {clinic?.tagline || 'درمان بدون دارو و بدون عوارض با rTMS، tDCS، CES'}
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => scrollTo(bookRef, 'book')}
                  className="px-8 py-3.5 bg-gradient-to-l from-[#2ab3b8] to-[#1a4a8a] text-white rounded-2xl font-bold text-sm hover:shadow-2xl hover:shadow-[#2ab3b8]/30 transition-all duration-300 flex items-center gap-2">
                  <Calendar size={18} /> دریافت نوبت حضوری
                </button>
                <button onClick={() => scrollTo(aboutRef, 'about')}
                  className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-medium text-sm hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2">
                  درباره دکتر
                </button>
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                {[
                  { icon: <Award size={16} />, label: `بیش از ${toPersianDigits(18)} سال سابقه` },
                  { icon: <Star size={16} />, label: 'متخصص اعصاب و روان' },
                  { icon: <GraduationCap size={16} />, label: 'عضو انجمن روانپزشکی' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/60 text-xs">
                    <span className="text-[#67e8f9]">{s.icon}</span> {s.label}
                  </div>
                ))}
              </div>
            </div>
            <div className={`hidden lg:flex justify-center items-center transition-all duration-700 delay-400 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="relative">
                <div className="w-80 h-80 rounded-[2rem] bg-gradient-to-br from-[#2ab3b8]/20 to-[#1a4a8a]/20 backdrop-blur-sm border border-white/10 flex items-center justify-center p-3">
                  <img src="/images/clinic/dr-hero.png" alt="دکتر محمد طاهری" className="w-full h-full rounded-[1.5rem] object-cover shadow-2xl" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-gradient-to-br from-[#2ab3b8] to-[#1a4a8a] rounded-2xl p-4 shadow-2xl">
                  <p className="text-white text-xs font-medium">نوبت‌دهی</p>
                  <p className="text-white text-2xl font-black">۲۴/۷</p>
                </div>
                <div className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 shadow-lg">
                  <Star size={24} className="text-yellow-400" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ===== ABOUT ===== */}
      <section ref={aboutRef} className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#1a4a8a]/5 rounded-full px-4 py-1.5 mb-3">
              <User size={14} className="text-[#2ab3b8]" />
              <span className="text-xs text-[#1a4a8a] font-medium">بیوگرافی</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-800 mb-2">دکتر محمد طاهری</h2>
            <p className="text-[#2ab3b8] font-bold text-sm">متخصص اعصاب و روان (روانپزشک)</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <img src="/images/clinic/dr-about.png" alt="دکتر محمد طاهری" className="w-full max-w-md mx-auto rounded-3xl shadow-2xl" />
            </div>
            <div className="space-y-5">
              <p className="text-gray-600 leading-relaxed text-sm">{DR_INFO.description}</p>
              <div className="space-y-4 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2ab3b8] to-[#1a4a8a] flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Award size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{toPersianDigits(18)} سال سابقه فعالیت</p>
                    <p className="text-[11px] text-gray-500">در بندرعباس و بیمارستان‌های مختلف</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2ab3b8] to-[#1a4a8a] flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Star size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">عضویت در کمیسیون‌های پزشکی</p>
                    <p className="text-[11px] text-gray-500">سابقه عضویت در کمیسیون‌های تخصصی</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2ab3b8] to-[#1a4a8a] flex items-center justify-center text-white shrink-0 mt-0.5">
                    <GraduationCap size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">گواهی TMS از دانشگاه Maastricht هلند</p>
                    <p className="text-[11px] text-gray-500">دارای گواهینامه معتبر بین‌المللی</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2ab3b8] to-[#1a4a8a] flex items-center justify-center text-white shrink-0 mt-0.5">
                    <BookOpen size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">سابقه تدریس دانشگاهی</p>
                    <p className="text-[11px] text-gray-500">روانپزشکی و روانشناسی در دانشگاه آزاد واحد بین‌الملل</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section ref={servicesRef} className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#1a4a8a]/5 rounded-full px-4 py-1.5 mb-3">
              <Stethoscope size={14} className="text-[#2ab3b8]" />
              <span className="text-xs text-[#1a4a8a] font-medium">خدمات</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-800 mb-2">خدمات تخصصی</h2>
            <p className="text-sm text-gray-400">دکتر محمد طاهری تنها مطب دارای TMS تحریک مغناطیسی مغز</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services_list.map((s, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 hover:border-[#2ab3b8]/30 hover:shadow-xl transition-all duration-300 text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2ab3b8]/10 to-[#1a4a8a]/10 mx-auto mb-4 flex items-center justify-center group-hover:from-[#2ab3b8]/20 group-hover:to-[#1a4a8a]/20 transition-all">
                  <s.icon size={28} className="text-[#1a4a8a]" />
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">{s.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 bg-gradient-to-br from-[#1a4a8a]/5 to-[#2ab3b8]/5 rounded-3xl p-6 sm:p-8 border border-[#1a4a8a]/10">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">خدمات مطب</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                'ویزیت تخصصی اعصاب و روان',
                'تحریک مغناطیسی مغز (rTMS) با پیشرفته‌ترین دستگاه',
                'تحریک الکتریکی مغز (tDCS, CES)، نقشه مغز (qEEG)',
                'خدمات توانبخشی مغز برای کودکان و نوجوانان',
                'انواع تست‌های تخصصی اختلالات شناختی، هوش و حافظه',
                'تست اختصاصی بیش فعالی کودکان',
                'واحد مشاوره و رواندرمانی، زوج درمانی',
                'مشاوره اعتیاد، مشاوره تحصیلی',
                'درمان با دستگاه‌های پیشرفته بدون عوارض برای افسردگی، اضطراب، وسواس، پانیک، میگرن',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-[#2ab3b8] shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ONLINE BOOKING ===== */}
      <section ref={bookRef} className="py-20 px-4 bg-white" id="book">
        <BookingSectionInner services={services} clinic={clinic} />
      </section>

      {/* ===== CONTACT ===== */}
      <section ref={contactRef} className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#1a4a8a]/5 rounded-full px-4 py-1.5 mb-3">
              <Phone size={14} className="text-[#2ab3b8]" />
              <span className="text-xs text-[#1a4a8a] font-medium">تماس با ما</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-800 mb-2">ارتباط با مطب</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 text-center hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2ab3b8]/10 to-[#1a4a8a]/10 mx-auto mb-4 flex items-center justify-center">
                <MapPin size={22} className="text-[#1a4a8a]" />
              </div>
              <h3 className="text-xs font-bold text-gray-800 mb-2">آدرس مطب</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{DR_INFO.address}</p>
            </div>
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 text-center hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2ab3b8]/10 to-[#1a4a8a]/10 mx-auto mb-4 flex items-center justify-center">
                <Phone size={22} className="text-[#1a4a8a]" />
              </div>
              <h3 className="text-xs font-bold text-gray-800 mb-2">شماره تماس</h3>
              <p className="text-xs text-gray-500 ltr" dir="ltr">{toPersianDigits(DR_INFO.phone2)} - {toPersianDigits(DR_INFO.phone1)}</p>
            </div>
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 text-center hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2ab3b8]/10 to-[#1a4a8a]/10 mx-auto mb-4 flex items-center justify-center">
                <Clock size={22} className="text-[#1a4a8a]" />
              </div>
              <h3 className="text-xs font-bold text-gray-800 mb-2">ساعت کاری</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{DR_INFO.workHours}</p>
            </div>
          </div>
          <div className="mt-8 bg-gradient-to-br from-[#1a4a8a]/5 to-[#2ab3b8]/5 rounded-3xl p-6 border border-[#1a4a8a]/10 text-center">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href={`tel:${DR_INFO.phone1}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1a4a8a] transition-colors">
                <Phone size={14} className="text-[#2ab3b8]" /> {toPersianDigits(DR_INFO.phone1)}
              </a>
              <a href={`tel:${DR_INFO.phone2}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1a4a8a] transition-colors">
                <Phone size={14} className="text-[#2ab3b8]" /> {toPersianDigits(DR_INFO.phone2)}
              </a>
              <a href={`mailto:${DR_INFO.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1a4a8a] transition-colors">
                <Mail size={14} className="text-[#2ab3b8]" /> {DR_INFO.email}
              </a>
              <a href={DR_INFO.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1a4a8a] transition-colors">
                <Instagram size={14} className="text-[#2ab3b8]" /> اینستاگرام
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#0a1f3a] text-white/60">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/images/clinic/logo.png" alt="لوگو" className="h-10 w-10 rounded-xl object-cover" />
                <span className="text-sm font-bold text-white">دکتر محمد طاهری</span>
              </div>
              <p className="text-xs leading-relaxed text-white/50">متخصص اعصاب و روان (روانپزشک)</p>
              <p className="text-[11px] leading-relaxed text-white/40 mt-2">دکتر محمد طاهری از بهترین متخصصان اعصاب و روان و روانپزشک در بندرعباس می‌باشد.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-4">دسترسی سریع</h4>
              <div className="space-y-2 text-xs">
                {navItems.map(item => (
                  <button key={item.id} onClick={() => scrollTo(item.ref, item.id)} className="block hover:text-[#67e8f9] transition-colors text-white/50 w-full text-right">{item.label}</button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-4">خدمات</h4>
              <div className="space-y-2 text-xs text-white/50">
                {['ویزیت تخصصی', 'rTMS', 'نوروفیدبک', 'مشاوره روانشناسی', 'تست‌های تخصصی'].map((s, i) => (
                  <p key={i}>{s}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-4">اطلاعات تماس</h4>
              <div className="space-y-3 text-xs text-white/50">
                <p className="flex items-start gap-2"><MapPin size={12} className="shrink-0 mt-0.5 text-[#67e8f9]" />{DR_INFO.address}</p>
                <p className="flex items-center gap-2 ltr" dir="ltr"><Phone size={12} className="shrink-0 text-[#67e8f9]" />{toPersianDigits(DR_INFO.phone1)}</p>
                <p className="flex items-center gap-2 ltr" dir="ltr"><Phone size={12} className="shrink-0 text-[#67e8f9]" />{toPersianDigits(DR_INFO.phone2)}</p>
                <p className="flex items-center gap-2" dir="ltr"><Mail size={12} className="shrink-0 text-[#67e8f9]" />{DR_INFO.email}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 text-center text-[10px] text-white/40">
            کلیه حقوق متعلق به دکتر محمد طاهری می‌باشد. طراحی سایت توسط رایا پارس
          </div>
        </div>
      </footer>

      {/* ===== INQUIRY MODAL ===== */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2ab3b8] to-[#1a4a8a] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Search size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-black text-gray-800">استعلام نوبت</h3>
              <p className="text-xs text-gray-400 mt-1">کد ملی و شماره پرونده خود را وارد کنید</p>
            </div>
            <input className="input-field text-center text-lg font-bold tracking-[0.3em] w-full mb-3" placeholder="کد ملی ۱۰ رقمی" value={inquiryCodeInput} onChange={e => setInquiryCodeInput(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} inputMode="numeric" autoFocus onKeyDown={e => { if (e.key === 'Enter' && inquiryCodeInput.length === 10) document.getElementById('inquiry-file-input')?.focus() }} />
            <input id="inquiry-file-input" className="input-field text-center text-lg font-bold tracking-[0.3em] w-full mb-4" placeholder="شماره پرونده" value={inquiryFileNumber} onChange={e => setInquiryFileNumber(e.target.value.replace(/\D/g, ''))} inputMode="numeric" onKeyDown={e => { if (e.key === 'Enter' && inquiryCodeInput.length === 10 && inquiryFileNumber) handleInquiry() }} />
            <div className="flex gap-3">
              <button onClick={() => { setInquiryModalOpen(false); setInquiryCodeInput(''); setInquiryFileNumber('') }} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-medium text-sm hover:bg-gray-200 transition-all">انصراف</button>
              <button onClick={handleInquiry} disabled={inquiryCodeInput.length !== 10 || !inquiryFileNumber}
                className="flex-1 py-3 bg-gradient-to-l from-[#1a4a8a] to-[#2ab3b8] text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-[#1a4a8a]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">تأیید</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================= BOOKING SECTION INNER ============================= */

function BookingSectionInner({ services, clinic }: { services: any[]; clinic: any }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState<'idle' | 'exists' | 'new'>('idle')
  const [nationalId, setNationalId] = useState('')
  const [patientData, setPatientData] = useState<any>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', gender: 'male', birth_date: '', father_name: '', education: '', job: '', address: '', emergency_phone: '' })
  const [serviceId, setServiceId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [timesLoading, setTimesLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('in_person')
  const [loading, setLoading] = useState(false)
  const [calendarOffset, setCalendarOffset] = useState(0)
  const [holidays, setHolidays] = useState<string[]>([])
  const modalNationalRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { getHolidays().then(({ data }) => setHolidays(Array.isArray(data) ? data.map((h: any) => h.date) : [])).catch(() => {}) } catch {}
  }, [])

  useEffect(() => {
    if (!serviceId && services.length > 0) {
      const sair = services.find((s: any) => s.name === 'سایر')
      setServiceId(String(sair ? sair.id : services[0].id))
    }
  }, [services])

  useEffect(() => {
    if (clinic && !clinic.zarinpal_merchant) setPaymentMethod('in_person')
  }, [clinic])

  useEffect(() => {
    if (modalOpen && modalNationalRef.current) setTimeout(() => modalNationalRef.current?.focus(), 100)
  }, [modalOpen])

  const openModal = () => {
    setNationalId(''); setPatientData(null); setModalStep('idle')
    setForm({ first_name: '', last_name: '', phone: '', gender: 'male', birth_date: '', father_name: '', education: '', job: '', address: '', emergency_phone: '' })
    setPaymentMethod('in_person'); setModalOpen(true)
  }

  const handleLookup = async () => {
    const nid = nationalId.replace(/\D/g, '')
    if (nid.length !== 10) { toast.error('کد ملی باید ۱۰ رقم باشد'); return }
    setLookupLoading(true)
    try {
      const { data } = await patientLookup(nid)
      if (data.exists) {
        setPatientData(data)
        setModalStep('exists')
        setForm(f => ({ ...f, first_name: data.first_name || '', last_name: data.last_name || '', phone: data.phone || '', gender: data.gender || 'male', birth_date: data.birth_date || '' }))
      } else {
        setPatientData(null)
        setModalStep('new')
        setForm(f => ({ ...f, phone: nid.slice(0, 3) === '09' ? '' : '' }))
      }
    } catch { toast.error('خطا در ارتباط با سرور') }
    finally { setLookupLoading(false) }
  }

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateStr); setSelectedTime('')
  }

  useEffect(() => {
    if (selectedDate && serviceId) {
      setTimesLoading(true)
      getAvailableTimes(serviceId, selectedDate)
        .then(({ data }) => { if (data.times) setAvailableTimes(data.times) })
        .catch(() => { setAvailableTimes([]) })
        .finally(() => setTimesLoading(false))
    } else {
      setAvailableTimes([])
    }
  }, [selectedDate, serviceId])

  const handleSubmit = async () => {
    const nid = nationalId.replace(/\D/g, '')
    if (!form.first_name || !form.last_name || !form.phone) { toast.error('سیستم غیرفعال است لطفا از حالت دیگری استفاده کنید'); return }
    setLoading(true)
    try {
      const payload: any = {
        national_id: nid, first_name: form.first_name, last_name: form.last_name,
        phone: form.phone, gender: form.gender || 'male',
        birth_date: form.birth_date || null, father_name: form.father_name || '',
        education: form.education || '', job: form.job || '',
        address: form.address || '', emergency_phone: form.emergency_phone || '',
        service_id: serviceId || 1, date: selectedDate, time: selectedTime + ':00',
        payment_method: paymentMethod,
      }
      const { data } = await createBooking(payload)
      setModalOpen(false)
      localStorage.setItem('booking_' + data.tracking_code, JSON.stringify({ result: data, paymentUrl: data.payment_url || '' }))
      window.location.href = '/booking-result/' + data.tracking_code
    } catch (err: any) { toast.error(err.response?.data?.error || 'خطا در ثبت نوبت') }
    finally { setLoading(false) }
  }

  const prevWeek = () => setCalendarOffset(o => o - 1)
  const nextWeek = () => setCalendarOffset(o => o + 1)
  const calendarDays = getDateRail(calendarOffset, selectedDate, holidays)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-[#1a4a8a]/5 rounded-full px-4 py-1.5 mb-3">
          <Calendar size={14} className="text-[#2ab3b8]" />
          <span className="text-xs text-[#1a4a8a] font-medium">نوبت‌دهی آنلاین</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-gray-800 mb-2">رزرو نوبت</h2>
        <p className="text-sm text-gray-400">به صورت آنلاین نوبت خود را رزرو کنید</p>
      </div>

      <div className="space-y-4">
        {/* Date Rail */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-4 sm:p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevWeek} className="p-1.5 hover:bg-gray-50 rounded-lg transition" title="هفته قبل"><ArrowRight size={16} className="text-gray-400" /></button>
            <span className="font-bold text-sm text-gray-700">تاریخ‌های موجود</span>
            <button onClick={nextWeek} className="p-1.5 hover:bg-gray-50 rounded-lg transition" title="هفته بعد"><ArrowLeft size={16} className="text-gray-400" /></button>
          </div>
          <div className="overflow-x-auto -mx-1 pb-1" style={{scrollbarWidth:'thin'}}>
            <div className="flex gap-1.5 min-w-max px-1">
              {calendarDays.map((d: any, i: number) => (
                <button key={i} onClick={() => !d.disabled && handleDateSelect(d)} disabled={d.disabled}
                  className={`flex flex-col items-center py-2.5 px-3 sm:px-4 rounded-2xl transition-all border-2 shrink-0 min-w-[72px] relative ${
                    d.disabled ? 'opacity-30 cursor-not-allowed border-transparent' :
                    d.selected ? 'bg-gradient-to-br from-[#2ab3b8] to-[#1a4a8a] text-white border-transparent shadow-md shadow-[#1a4a8a]/20' :
                    d.isHoliday ? 'border-red-200 text-red-400 hover:bg-red-50' :
                    'border-gray-100 text-gray-600 hover:border-[#2ab3b8]/30 hover:shadow-sm'
                  }`}>
                  <span className="text-[9px] font-bold">{d.dayName}</span>
                  <span className="text-lg font-black leading-tight mt-0.5">{d.day}</span>
                  <span className="text-[9px] opacity-60 font-medium mt-0.5">{d.monthName}</span>
                  {d.isHoliday && <span className="text-[7px] text-red-400 font-semibold">تعطیل</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-5 sm:p-6 border border-gray-100 mt-4 animate-fade-in-up">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-[#2ab3b8]" />
              ساعات آزاد برای {getJalaliDateStr(selectedDate)}
            </h3>
            {timesLoading ? (
              <div className="flex justify-center py-8"><div className="spinner-iranian" /></div>
            ) : availableTimes.length === 0 ? (
              <div className="text-center py-6">
                <Clock size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">هیچ وقت آزادی برای این روز وجود ندارد</p>
                <p className="text-[10px] text-gray-300 mt-1">روز دیگری را انتخاب کنید</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(() => {
                  const todayStr = new Date().toISOString().slice(0, 10)
                  const isToday = selectedDate === todayStr
                  const nowTime = new Date().toTimeString().slice(0, 5)
                  return TIME_SLOTS.map((t: string) => {
                    const isBooked = !availableTimes.includes(t)
                    const isPast = isToday && t <= nowTime
                    const isSelected = selectedTime === t
                    const disabled = isBooked || isPast
                    return (
                      <button key={t} onClick={() => { if (!disabled) { setSelectedTime(t); openModal() } }} disabled={disabled}
                        className={`p-2.5 rounded-2xl border-2 text-sm transition-all ${
                          disabled
                            ? isPast
                              ? 'border-red-100 bg-red-50 text-red-300 cursor-not-allowed line-through opacity-60'
                              : 'border-gray-50 bg-gray-50 text-gray-200 cursor-not-allowed line-through'
                            : isSelected
                              ? 'border-[#2ab3b8] bg-gradient-to-br from-[#2ab3b8]/10 to-[#1a4a8a]/10 text-[#1a4a8a] font-bold shadow-md'
                              : 'border-gray-100 hover:border-[#2ab3b8]/40 text-gray-600 hover:shadow-sm bg-white'
                        }`}>
                        {isPast ? 'ساعت گذشته' : t}
                      </button>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        )}


      </div>

      {/* National ID Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 p-5 pb-3 border-b border-gray-100 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <User size={16} className="text-[#2ab3b8]" />
                {modalStep === 'exists' && 'تأیید اطلاعات'}
                {modalStep === 'new' && 'ثبت نام بیمار جدید'}
                {modalStep === 'idle' && 'استعلام بیمار'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-all">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {modalStep === 'idle' && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-4">لطفاً کد ملی خود را وارد کنید</p>
                  <div className="flex gap-3 max-w-xs mx-auto">
                    <input ref={modalNationalRef} className="input-field text-center text-lg font-bold tracking-[0.3em] flex-1" placeholder="کد ملی" value={nationalId} onChange={e => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} inputMode="numeric" onKeyDown={e => { if (e.key === 'Enter') handleLookup() }} />
                    <button onClick={handleLookup} disabled={lookupLoading || nationalId.length !== 10}
                      className="px-5 py-2.5 bg-gradient-to-l from-[#1a4a8a] to-[#2ab3b8] text-white rounded-2xl font-bold text-sm hover:shadow-xl hover:shadow-[#1a4a8a]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap">
                      {lookupLoading ? <div className="spinner-iranian !w-4 !h-4 !border-white !border-t-[#2ab3b8]" /> : 'استعلام'}
                    </button>
                  </div>
                </div>
              )}
              {modalStep === 'exists' && patientData && (
                <>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100 text-center">
                      <CheckCircle size={28} className="mx-auto text-green-500 mb-2" />
                      <p className="text-sm font-bold text-green-700">شما از قبل در سیستم ثبت‌نام کرده‌اید</p>
                      {patientData.file_number && <p className="text-xs text-gray-500 mt-1">شماره پرونده: {toPersianDigits(patientData.file_number)}</p>}
                      <p className="text-xs text-amber-600 font-semibold mt-2">⚠️ شماره پرونده خود را جهت استعلام و مراجعات بعدی نزد خود نگه دارید</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div><label className="label text-[10px]">جنسیت</label>
                      <select className="input-field text-sm" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                        <option value="male">آقا</option><option value="female">خانم</option>
                      </select>
                    </div>
                    <div><label className="label text-[10px]">نام</label><input className="input-field text-sm" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} /></div>
                    <div><label className="label text-[10px]">نام خانوادگی</label><input className="input-field text-sm" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} /></div>
                    <div><label className="label text-[10px]">شماره همراه <span className="text-rose-500">*</span></label><input className="input-field text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} inputMode="tel" /></div>
                    <div className="col-span-2"><label className="label text-[10px]">نام پدر</label><input className="input-field text-sm" value={form.father_name} onChange={e => setForm({...form, father_name: e.target.value})} /></div>
                    <div className="col-span-2"><JalaliDateInput label="تاریخ تولد" labelClass="!text-[10px]" value={form.birth_date} onChange={v => setForm({...form, birth_date: v})} /></div>
                  </div>
                </>
              )}
              {modalStep === 'new' && (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 text-center">
                      <User size={28} className="mx-auto text-blue-500 mb-2" />
                      <p className="text-sm font-bold text-blue-700">بیمار جدید</p>
                      <p className="text-xs text-gray-500 mt-1">شماره پرونده برای شما صادر می‌شود</p>
                      <p className="text-xs text-amber-600 font-semibold mt-2">⚠️ پس از ثبت نوبت، شماره پرونده خود را جهت استعلام و مراجعات بعدی نزد خود نگه دارید</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div><label className="label text-[10px]">جنسیت</label>
                      <select className="input-field text-sm" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                        <option value="male">آقا</option><option value="female">خانم</option>
                      </select>
                    </div>
                    <div><label className="label text-[10px]">نام <span className="text-rose-500">*</span></label><input className="input-field text-sm" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} /></div>
                    <div><label className="label text-[10px]">نام خانوادگی <span className="text-rose-500">*</span></label><input className="input-field text-sm" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} /></div>
                    <div><label className="label text-[10px]">شماره همراه <span className="text-rose-500">*</span></label><input className="input-field text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} inputMode="tel" /></div>
                    <div className="col-span-2"><label className="label text-[10px]">نام پدر</label><input className="input-field text-sm" value={form.father_name} onChange={e => setForm({...form, father_name: e.target.value})} /></div>
                    <div className="col-span-2"><JalaliDateInput label="تاریخ تولد" labelClass="!text-[10px]" value={form.birth_date} onChange={v => setForm({...form, birth_date: v})} /></div>
                    <div><label className="label text-[10px]">تحصیلات</label>
                      <select className="input-field text-sm" value={form.education} onChange={e => setForm({...form, education: e.target.value})}>
                        <option value="">انتخاب...</option>
                        <option value="زیر دیپلم">زیر دیپلم</option><option value="دیپلم">دیپلم</option>
                        <option value="فوق دیپلم">فوق دیپلم</option><option value="لیسانس">لیسانس</option>
                        <option value="فوق لیسانس">فوق لیسانس</option><option value="دکترا">دکترا</option>
                      </select>
                    </div>
                    <div><label className="label text-[10px]">شغل</label>
                      <select className="input-field text-sm" value={form.job} onChange={e => setForm({...form, job: e.target.value})}>
                        <option value="">انتخاب کنید</option>
                        <option value="doctor">پزشک</option><option value="midwife">ماما</option>
                        <option value="engineer">مهندس</option><option value="nurse">پرستار</option>
                        <option value="employee">کارمند</option><option value="worker">کارگر</option>
                        <option value="housewife">خانه دار</option><option value="freelance">آزاد</option>
                      </select>
                    </div>
                    <div className="col-span-2"><label className="label text-[10px]">آدرس</label><input className="input-field text-sm" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
                    <div className="col-span-2"><label className="label text-[10px]">تلفن ضروری</label><input className="input-field text-sm" value={form.emergency_phone} onChange={e => setForm({...form, emergency_phone: e.target.value})} inputMode="tel" /></div>
                  </div>
                </>
              )}
              {modalStep !== 'idle' && (
                <div className="border-t border-gray-100 pt-4 space-y-4">
                    <>
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
                        <p className="flex justify-between"><span className="text-gray-400">بیمار</span><span className="font-semibold text-gray-700">{form.gender === 'male' ? 'آقای' : 'خانم'} {form.first_name} {form.last_name}</span></p>
                        <p className="flex justify-between"><span className="text-gray-400">تاریخ</span><span className="font-semibold text-gray-700">{getJalaliDateStr(selectedDate)}</span></p>
                        <p className="flex justify-between"><span className="text-gray-400">ساعت</span><span className="font-semibold text-gray-700">{toPersianDigits(selectedTime)}</span></p>
                      </div>
                      <div>
                        <label className="label text-xs">روش پرداخت هزینه</label>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                          <button onClick={() => setPaymentMethod('in_person')}
                            className={`p-3 rounded-2xl border-2 text-center transition-all ${paymentMethod === 'in_person' ? 'border-amber-400 bg-amber-50' : 'border-gray-100'}`}>
                            <Building2 size={20} className="mx-auto text-amber-500" />
                            <p className="text-[10px] font-bold mt-1">مطب</p>
                          </button>
                          <button onClick={() => { if (clinic?.zarinpal_merchant) setPaymentMethod('online') }}
                            className={`p-3 rounded-2xl border-2 text-center transition-all ${
                              !clinic?.zarinpal_merchant
                                ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                : paymentMethod === 'online' ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100'
                            }`}>
                            <CreditCard size={20} className={`mx-auto ${clinic?.zarinpal_merchant ? 'text-emerald-500' : 'text-gray-300'}`} />
                            <p className="text-[10px] font-bold mt-1">آنلاین</p>
                          </button>
                        </div>
                      </div>
                      <button onClick={handleSubmit} disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-l from-[#1a4a8a] via-[#1a4a8a] to-[#2ab3b8] text-white rounded-2xl font-bold text-sm hover:shadow-2xl hover:shadow-[#1a4a8a]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2">
                        {loading ? <div className="spinner-iranian !w-4 !h-4 !border-white !border-t-[#2ab3b8]" /> : <CheckSquare size={16} />}
                        {loading ? 'در حال ثبت...' : 'ثبت نوبت'}
                      </button>
                    </>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



/* ============================= HELPERS ============================= */

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-semibold text-gray-700 ${valueClass || ''}`}>{value}</span>
    </div>
  )
}

function getJalaliDateStr(gregDate: string) {
  if (!gregDate) return ''
  const [gy, gm, gd] = gregDate.split('-').map(Number)
  if (!gy) return ''
  const j = gregorianToJalali(gy, gm, gd)
  return `${j[2]} ${MONTHS[j[1] - 1]} ${j[0]}`
}

function getDateRail(weekOffset: number, selectedDate: string, holidays: string[] = []) {
  const DAYS_TO_SHOW = 28
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() + weekOffset * 7)
  const days: any[] = []
  for (let i = 0; i < DAYS_TO_SHOW; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    const j = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate())
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const isPast = date < today
    const isFriday = date.getDay() === 5
    const isToday = date.getTime() === today.getTime()
    const isHoliday = isFriday || holidays.includes(dateStr)
    const isSelected = selectedDate === dateStr
    days.push({
      day: j[2],
      monthName: MONTHS[j[1] - 1],
      dayName: WEEKDAYS[date.getDay()],
      dateStr, date, isPast, isToday, isHoliday,
      disabled: isPast || isHoliday,
      selected: isSelected,
    })
  }
  return days
}
