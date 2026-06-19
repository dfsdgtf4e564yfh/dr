from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from patients.models import Patient
from datetime import date

User = get_user_model()

JOBS = ['employee', 'employee', 'employee', 'doctor', 'employee', 'freelance', 'employee', 'freelance', 'employee',
         'nurse', 'employee', 'housewife', 'freelance', 'employee', 'employee', 'employee', 'employee', 'doctor',
         'worker', 'employee', 'employee', 'employee', 'freelance', 'employee', 'freelance']

PATIENTS = [
    {'first_name': 'علی', 'last_name': 'محمدی', 'father_name': 'حسین', 'national_id': '0010000001', 'phone': '09120000001', 'emergency_phone': '09130000001', 'gender': 'male', 'birth_date': date(1985, 3, 15), 'education': 'master', 'address': 'تهران، خیابان انقلاب، کوچه ۱۲', 'medical_history': 'فشار خون', 'routine_medications': 'لوزارتان'},
    {'first_name': 'مریم', 'last_name': 'احمدی', 'father_name': 'محمد', 'national_id': '0020000002', 'phone': '09120000002', 'emergency_phone': '09130000002', 'gender': 'female', 'birth_date': date(1990, 7, 22), 'education': 'licence', 'address': 'تهران، خیابان ولیعصر، کوچه ۵', 'medical_history': 'میگرن', 'routine_medications': 'سوماتریپتان'},
    {'first_name': 'حسین', 'last_name': 'رضایی', 'father_name': 'علی', 'national_id': '0030000003', 'phone': '09120000003', 'emergency_phone': '09130000003', 'gender': 'male', 'birth_date': date(1978, 11, 8), 'education': 'diplom', 'address': 'اصفهان، خیابان چهارباغ', 'medical_history': 'دیابت نوع ۲', 'routine_medications': 'متفورمین'},
    {'first_name': 'زهرا', 'last_name': 'حسینی', 'father_name': 'حسن', 'national_id': '0040000004', 'phone': '09120000004', 'emergency_phone': '09130000004', 'gender': 'female', 'birth_date': date(1995, 5, 30), 'education': 'doctora', 'address': 'شیراز، خیابان زند', 'medical_history': '', 'routine_medications': ''},
    {'first_name': 'محمد', 'last_name': 'کریمی', 'father_name': 'علی', 'national_id': '0050000005', 'phone': '09120000005', 'emergency_phone': '09130000005', 'gender': 'male', 'birth_date': date(1982, 9, 14), 'education': 'master', 'address': 'مشهد، خیابان امام رضا', 'medical_history': 'آسم', 'routine_medications': 'ونتولین'},
    {'first_name': 'فاطمه', 'last_name': 'موسوی', 'father_name': 'محمد', 'national_id': '0060000006', 'phone': '09120000006', 'emergency_phone': '09130000006', 'gender': 'female', 'birth_date': date(1988, 2, 10), 'education': 'super_diplom', 'address': 'تبریز، خیابان امام', 'medical_history': '', 'routine_medications': ''},
    {'first_name': 'امیر', 'last_name': 'جعفری', 'father_name': 'رضا', 'national_id': '0070000007', 'phone': '09120000007', 'emergency_phone': '09130000007', 'gender': 'male', 'birth_date': date(1992, 8, 25), 'education': 'licence', 'address': 'تهران، سعادت‌آباد', 'medical_history': 'کمردرد', 'routine_medications': 'ایبوپروفن'},
    {'first_name': 'سارا', 'last_name': 'نوروزی', 'father_name': 'احمد', 'national_id': '0080000008', 'phone': '09120000008', 'emergency_phone': '09130000008', 'gender': 'female', 'birth_date': date(1993, 12, 5), 'education': 'master', 'address': 'تهران، ونک', 'medical_history': 'اضطراب', 'routine_medications': 'سرترالین'},
    {'first_name': 'رضا', 'last_name': 'قاسمی', 'father_name': 'محمد', 'national_id': '0090000009', 'phone': '09120000009', 'emergency_phone': '09130000009', 'gender': 'male', 'birth_date': date(1975, 6, 18), 'education': 'diplom', 'address': 'کرج، عظیمیه', 'medical_history': 'آرتروز', 'routine_medications': 'گلوکزامین'},
    {'first_name': 'نرگس', 'last_name': 'صادقی', 'father_name': 'حسین', 'national_id': '0100000010', 'phone': '09120000010', 'emergency_phone': '09130000010', 'gender': 'female', 'birth_date': date(1991, 4, 12), 'education': 'licence', 'address': 'تهران، شریعتی', 'medical_history': '', 'routine_medications': ''},
    {'first_name': 'احمد', 'last_name': 'طاهری', 'father_name': 'محمد', 'national_id': '0110000011', 'phone': '09120000011', 'emergency_phone': '09130000011', 'gender': 'male', 'birth_date': date(1980, 10, 3), 'education': 'doctora', 'address': 'اصفهان، ملک‌شهر', 'medical_history': 'کلسترول', 'routine_medications': 'آتورواستاتین'},
    {'first_name': 'زینب', 'last_name': 'محمدپور', 'father_name': 'علی', 'national_id': '0120000012', 'phone': '09120000012', 'emergency_phone': '09130000012', 'gender': 'female', 'birth_date': date(1987, 1, 28), 'education': 'diplom', 'address': 'تهران، تهرانپارس', 'medical_history': 'کم خونی', 'routine_medications': 'فروس سولفات'},
    {'first_name': 'مهدی', 'last_name': 'کاظمی', 'father_name': 'حسن', 'national_id': '0130000013', 'phone': '09120000013', 'emergency_phone': '09130000013', 'gender': 'male', 'birth_date': date(1983, 7, 9), 'education': 'super_diplom', 'address': 'شیراز، معالی‌آباد', 'medical_history': 'سینوزیت', 'routine_medications': 'آموکسی سیلین'},
    {'first_name': 'الهام', 'last_name': 'شفیعی', 'father_name': 'رضا', 'national_id': '0140000014', 'phone': '09120000014', 'emergency_phone': '09130000014', 'gender': 'female', 'birth_date': date(1994, 9, 20), 'education': 'master', 'address': 'تهران، جردن', 'medical_history': 'افسردگی', 'routine_medications': 'فلوکستین'},
    {'first_name': 'سعید', 'last_name': 'ابراهیمی', 'father_name': 'احمد', 'national_id': '0150000015', 'phone': '09120000015', 'emergency_phone': '09130000015', 'gender': 'male', 'birth_date': date(1979, 11, 15), 'education': 'master', 'address': 'تهران، الهیه', 'medical_history': 'قلبی', 'routine_medications': 'آسپرین'},
    {'first_name': 'لیلا', 'last_name': 'مرادی', 'father_name': 'محمد', 'national_id': '0160000016', 'phone': '09120000016', 'emergency_phone': '09130000016', 'gender': 'female', 'birth_date': date(1996, 3, 8), 'education': 'master', 'address': 'رشت، گلسار', 'medical_history': '', 'routine_medications': ''},
    {'first_name': 'حمید', 'last_name': 'نیکخواه', 'father_name': 'رضا', 'national_id': '0170000017', 'phone': '09120000017', 'emergency_phone': '09130000017', 'gender': 'male', 'birth_date': date(1986, 6, 22), 'education': 'licence', 'address': 'قم، بلوار امین', 'medical_history': 'آلرژی', 'routine_medications': 'لوراتادین'},
    {'first_name': 'سمیرا', 'last_name': 'حیدری', 'father_name': 'علی', 'national_id': '0180000018', 'phone': '09120000018', 'emergency_phone': '09130000018', 'gender': 'female', 'birth_date': date(1989, 8, 14), 'education': 'doctora', 'address': 'تهران، تجریش', 'medical_history': '', 'routine_medications': ''},
    {'first_name': 'جواد', 'last_name': 'صالحی', 'father_name': 'حسین', 'national_id': '0190000019', 'phone': '09120000019', 'emergency_phone': '09130000019', 'gender': 'male', 'birth_date': date(1977, 12, 1), 'education': 'ciclu', 'address': 'اهواز، کیان‌آباد', 'medical_history': 'دیابت', 'routine_medications': 'انسولین'},
    {'first_name': 'معصومه', 'last_name': 'علیزاده', 'father_name': 'محمد', 'national_id': '0200000020', 'phone': '09120000020', 'emergency_phone': '09130000020', 'gender': 'female', 'birth_date': date(1997, 5, 16), 'education': 'licence', 'address': 'تهران، امیرآباد', 'medical_history': '', 'routine_medications': ''},
    {'first_name': 'مجید', 'last_name': 'حاجی‌زاده', 'father_name': 'حسن', 'national_id': '0210000021', 'phone': '09120000021', 'emergency_phone': '09130000021', 'gender': 'male', 'birth_date': date(1981, 4, 29), 'education': 'licence', 'address': 'کرج، فردیس', 'medical_history': 'چربی خون', 'routine_medications': 'ژمفیبروزیل'},
    {'first_name': 'مرضیه', 'last_name': 'واعظی', 'father_name': 'احمد', 'national_id': '0220000022', 'phone': '09120000022', 'emergency_phone': '09130000022', 'gender': 'female', 'birth_date': date(1992, 10, 7), 'education': 'master', 'address': 'تهران، پونک', 'medical_history': 'تیروئید', 'routine_medications': 'لووتیروکسین'},
    {'first_name': 'محسن', 'last_name': 'غفاری', 'father_name': 'علی', 'national_id': '0230000023', 'phone': '09120000023', 'emergency_phone': '09130000023', 'gender': 'male', 'birth_date': date(1984, 2, 19), 'education': 'super_diplom', 'address': 'تهران، ستارخان', 'medical_history': '', 'routine_medications': ''},
    {'first_name': 'ناهید', 'last_name': 'کرمی', 'father_name': 'رضا', 'national_id': '0240000024', 'phone': '09120000024', 'emergency_phone': '09130000024', 'gender': 'female', 'birth_date': date(1990, 6, 11), 'education': 'master', 'address': 'تهران، نارمک', 'medical_history': 'میگرن', 'routine_medications': 'پروفن'},
    {'first_name': 'کیان', 'last_name': 'بهرامی', 'father_name': 'محمد', 'national_id': '0250000025', 'phone': '09120000025', 'emergency_phone': '09130000025', 'gender': 'male', 'birth_date': date(1993, 8, 27), 'education': 'master', 'address': 'تهران، شهرک غرب', 'medical_history': '', 'routine_medications': ''},
]


class Command(BaseCommand):
    help = 'Create 25 sample patients with complete data'

    def handle(self, *args, **options):
        created = 0
        for i, data in enumerate(PATIENTS):
            data['job'] = JOBS[i] if i < len(JOBS) else ''
            patient, was_created = Patient.objects.get_or_create(
                national_id=data['national_id'],
                defaults=data,
            )
            if was_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(f'{created} patient sample created'))
