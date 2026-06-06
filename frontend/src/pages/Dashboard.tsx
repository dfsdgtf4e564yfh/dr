import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { PersianAvatar } from '../components/PersianAvatar';
import { formatPersianDateWithDayName, toPersianNumber, getPersianToday, IRAN_HOLIDAYS, isHoliday } from '../utils/persianDateUtils';

interface DashboardProps {
  userName: string;
  userRole: 'doctor' | 'manager' | 'receptionist';
}

/**
 * صفحه Dashboard - خوش‌آمدگویی ایرانی حرفه‌ای
 * با طراحی الهام‌گرفته از تمدن کهن ایران
 */

const Dashboard: React.FC<DashboardProps> = ({ userName, userRole }) => {
  const today = useMemo(() => new Date(), []);
  const persianDateFull = useMemo(() => formatPersianDateWithDayName(today), [today]);
  const persianToday = useMemo(() => getPersianToday(), []);
  const [jy, jm, jd] = persianToday;

  // بررسی تعطیل
  const holidayInfo = useMemo(() => {
    const holiday = IRAN_HOLIDAYS.find(h => h.month === jm && h.day === jd);
    return holiday ? { name: holiday.name, isClosed: true } : { name: '', isClosed: isHoliday(jy, jm, jd) };
  }, [jy, jm, jd]);

  // متن خوش‌آمدگویی متناسب با نقش
  const getWelcomeMessage = () => {
    const hour = today.getHours();
    let greeting = '';

    if (hour < 12) greeting = 'صبح بخیر';
    else if (hour < 18) greeting = 'ظهر بخیر';
    else greeting = 'شب بخیر';

    switch (userRole) {
      case 'doctor':
        return `${greeting} دکتر ${userName}! امیدوارم روز پر از سلامتی باشد.`;
      case 'manager':
        return `${greeting} آقای مدیر ${userName}! خوش آمدید.`;
      case 'receptionist':
        return `${greeting} ${userName}! برای کمک به بیماران آماده هستیم.`;
      default:
        return `${greeting} ${userName}!`;
    }
  };

  // داده‌های Dashboard (نمونه)
  const dashboardStats = [
    {
      icon: Users,
      label: 'بیماران امروز',
      value: toPersianNumber(12),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Calendar,
      label: 'قرارملاقات‌ها',
      value: toPersianNumber(8),
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Clock,
      label: 'در انتظار',
      value: toPersianNumber(3),
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      icon: TrendingUp,
      label: 'تکمیل شده',
      value: toPersianNumber(5),
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-surface-50 to-slate-100">
      {/* هدر خوش‌آمدگویی */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-l from-persian-600 via-persian-500 to-persian-700 px-4 py-12 md:py-16"
      >
        {/* پس‌زمینه تزئینی - الهام‌گرفته از هندسه ایرانی */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* قسمت متن */}
            <motion.div variants={itemVariants} className="text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                {getWelcomeMessage()}
              </h1>
              <p className="text-lg text-persian-100 mb-2">
                {persianDateFull}
              </p>

              {/* نشان تعطیل */}
              {holidayInfo.isClosed && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-4 bg-amber-400 bg-opacity-20 border-2 border-amber-300 rounded-lg p-3 w-fit"
                >
                  <p className="text-amber-50 font-semibold">
                    ⭐ {holidayInfo.name} - کلینیک تعطیل است
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* قسمت Avatar */}
            <motion.div
              variants={itemVariants}
              className="flex justify-center md:justify-start"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-2xl scale-150" />
                <PersianAvatar
                  name={userName}
                  role={userRole}
                  size="large"
                  animated={true}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* محتوای اصلی */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 py-12"
      >
        {/* کارت‌های آمار */}
        <motion.div variants={itemVariants} className="mb-12">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">آمار امروز</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ translateY: -8 }}
                  className={`${stat.bgColor} rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-slate-800">
                      {stat.value}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* سریع‌ترین عملیات */}
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">دسترسی سریع</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['قرارملاقات جدید', 'بیمار جدید', 'مشاهده بیماران'].map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white rounded-xl p-6 shadow-soft hover:shadow-soft-lg hover:border-persian-300 border-2 border-transparent transition-all text-slate-700 font-semibold"
              >
                {action}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* پاورقی حرفه‌ای */}
      <motion.div
        variants={itemVariants}
        className="text-center text-slate-500 text-sm py-8 border-t border-slate-200"
      >
        <p>مدیریت کلینیک درمانی • نسخه ۱.۰ • {persianDateFull}</p>
      </motion.div>
    </div>
  );
};

export default Dashboard;
