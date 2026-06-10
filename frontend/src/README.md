# 🏥 مدیریت کلینیک درمانی - Dashboard Persian Enhancement

## 📋 توضیحات پروژه

این پروژه یک سیستم جامع مدیریت کلینیک درمانی است که به‌طور کامل **ایرانی‌سازی** شده و با **تمدن کهن ایران** الهام‌گرفته است.

### ✨ ویژگی‌های اصلی:

#### 🌍 **ایرانی‌سازی جامع:**
- ✅ **اعداد فارسی** - تمام اعداد به فارسی نمایش داده می‌شوند (۰-۹)
- ✅ **تاریخ شمسی** - سال‌های شمسی و ماه‌های ایرانی
- ✅ **تعطیلات رسمی ایران** - تعطیل‌های رسمی و جمعه‌ها
- ✅ **RTL Layout** - طراحی راست‌به‌چپ برای فارسی
- ✅ **فونت‌های فارسی** - فونت Vazirmatn حرفه‌ای

#### 🎨 **طراحی حرفه‌ای:**
- 🎭 **رنگ‌های ایرانی** - الهام‌گرفته از تمدن کهن (آبی آسمان، طلای ایرانی، سبز باغ‌ها)
- 🏛️ **المان‌های ایرانی** - آیکون‌ها و آرایش‌های هندسی
- ⚡ **Animation‌های حرفه‌ای** - استفاده از Framer Motion برای animation‌های روان
- 📱 **Responsive Design** - طراحی برای تمام دستگاه‌ها

#### 👥 **Avatar کارتر برای انواع کاربران:**

**👨‍⚕️ پزشک:**
- سر و بدن انسان
- گوشی‌های پزشکی (Stethoscope)
- صلیب پزشکی
- رنگ آبی (نماد اعتماد و درمان)
- Animation: شناور در هوا (Float)

**👔 مدیر:**
- کت رسمی
- کراوات
- تاج (نماد رهبری)
- رنگ طلایی (نماد اختیار و مسئولیت)
- Animation: چرخش ملایم (Spin)

**📞 پذیرش:**
- تلفن در دست
- لبخند (شادی خدمت)
- ستاره (نماد پذیرش)
- رنگ سبز (نماد خدمت و کمک)
- Animation: تپش قلب (Pulse)

#### 📊 **Dashboard:**
- 👋 خوش‌آمدگویی شخصی‌سازی شده برای هر کاربر
- 📅 نمایش تاریخ شمسی دقیق
- 🎯 آمار کلینیک (بیماران، قرارملاقات‌ها، etc.)
- 🚨 نشان‌دهندگی تعطیلات و روز‌های تعطیل
- 🎨 رنگ‌بندی متفاوت برای هر نقش کاربر

## 📁 ساختار پروژه

```
frontend/src/
├── components/
│   └── PersianAvatar.tsx          # کامپوننت‌های Avatar
├── pages/
│   └── Dashboard.tsx               # صفحه Dashboard
├── utils/
│   └── persianDateUtils.ts        # Utilities تاریخ و اعداد
├── i18n/
│   └── fa-IR.json                 # متون ایرانی‌سازی شده
└── tailwind.config.js             # تنظیمات رنگ‌های ایرانی
```

## 🛠️ فایل‌های اضافه شده:

### 1. **persianDateUtils.ts**
تمام ابزارهای تاریخ و اعداد:
```typescript
- toPersianNumber()              // تبدیل اعداد انگلیسی به فارسی
- toEnglishNumber()              // تبدیل فارسی به انگلیسی
- gregorianToJalali()            // تبدیل میلادی به شمسی
- jalaliToGregorian()            // تبدیل شمسی به میلادی
- formatPersianDate()            // فرمت تاریخ شمسی
- formatPersianDateWithDayName() // تاریخ + نام روز
- isHoliday()                    // بررسی تعطیل
- getPersianToday()              // تاریخ امروز به شمسی
```

### 2. **PersianAvatar.tsx**
کامپوننت‌های Avatar برای انواع کاربران:
- `DoctorAvatar` - آواتار پزشک
- `ManagerAvatar` - آواتار مدیر
- `ReceptionistAvatar` - آواتار پذیرش
- `PersianAvatar` - کامپوننت اصلی

### 3. **Dashboard.tsx**
صفحه Dashboard حرفه‌ای:
- خوش‌آمدگویی شخصی‌سازی شده
- نمایش تاریخ شمسی
- آمار کلینیک با اعداد فارسی
- نشان‌دهندگی تعطیلات
- Avatar کاربر

### 4. **fa-IR.json**
تمام متون ایرانی‌سازی شده برای UI

### 5. **tailwind.config.js**
تنظیمات Tailwind:
- رنگ‌های ایرانی (persian, iranian, garden, surface)
- Shadow‌های بهتر (glow-golden, persian)
- Animation‌های اضافی (ornament)
- RTL Support

## 🎨 رنگ‌های ایرانی:

```
🔵 Persian (آبی)
- آسمان ایران و دریای خزر
- Brand رنگ اصلی

🟡 Iranian (طلایی)
- طلای ایرانی و آثار تاریخی
- نماد ارزش و تمدن

🟢 Garden (سبز)
- باغ‌های ایران
- نماد رشد و سلامتی

⚫ Slate (سرمه‌ای)
- دیوار‌های قدیم
- رنگ پایه
```

## 💻 استفاده:

### نمایش Dashboard:
```tsx
import Dashboard from './pages/Dashboard';

<Dashboard 
  userName="دکتر احمد" 
  userRole="doctor" 
/>
```

### استفاده از Utilities:
```tsx
import { 
  toPersianNumber, 
  formatPersianDateWithDayName,
  isHoliday 
} from './utils/persianDateUtils';

// تبدیل اعداد
toPersianNumber(1234) // "۱۲۳۴"

// تاریخ فارسی
formatPersianDateWithDayName(new Date()) // "شنبه ۵ خرداد ۱۴۰۳"

// بررسی تعطیل
isHoliday(1403, 1, 1) // true (نوروز)
```

### استفاده از Avatar:
```tsx
import { PersianAvatar } from './components/PersianAvatar';

<PersianAvatar 
  name="دکتر علی"
  role="doctor"
  size="large"
  animated={true}
/>
```

## 📦 Dependencies:

```json
{
  "react": "^18.3.1",
  "framer-motion": "^12.40.0",
  "tailwindcss": "^3.4.17",
  "lucide-react": "^0.460.0"
}
```

## 🚀 نکات:

✅ **تمدن کهن ایران:** هر طراحی الهام‌گرفته از تاریخ و فرهنگ ایران
✅ **حرفه‌ای:** قابل استفاده در محیط‌های کاری جدی
✅ **کارآمد:** بهینه‌سازی شده برای عملکرد بهتر
✅ **قابل توسعه:** طراحی برای اضافه کردن ویژگی‌های جدید

---

**نسخه:** 1.0  
**آخرین به‌روزرسانی:** 1403/03/15 (تاریخ شمسی)
