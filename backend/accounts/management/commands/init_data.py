from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.permission_defs import ALL_PAGES, DEFAULT_ROLE_PERMISSIONS
from accounts.models import ClinicSetting
from medical_records.models import CommonDiagnosis

User = get_user_model()

ALL_PERMISSIONS = [p['codename'] for p in ALL_PAGES]

DOCTOR_LIMITED_PERMS = ['dashboard', 'dashboard_income', 'doctor_finance']

class Command(BaseCommand):
    help = 'Create default system users and clinic settings'

    def handle(self, *args, **options):
        changes = []

        LIMITED_DOCTORS = {'neda_masteran', 'maryam_rashidi', 'anahita_falahian', 'atefeh_heidari'}
        SPECIAL_ACCESS_USERS = {'shirin_hamzeii', 'mina_moradi'}

        old_user = User.objects.filter(username='shirit_hamzeii').first()
        if old_user:
            old_user.username = 'shirin_hamzeii'
            old_user.first_name = 'شیرین'
            old_user.save(update_fields=['username', 'first_name'])
            changes.append('shirit_hamzeii renamed to shirin_hamzeii with name شیرین')

        naimi_user = User.objects.filter(username='naimi').first()
        if naimi_user:
            naimi_user.username = 'tahereh_naimi'
            naimi_user.first_name = 'طاهره'
            naimi_user.save(update_fields=['username', 'first_name'])
            changes.append('naimi renamed to tahereh_naimi with first_name طاهره')

        for username, password, role, first_name, last_name, phone, label in [
            ('admin', 'admin123', 'admin', 'محمد', 'طاهری', '', 'مدیر کلینیک'),
            ('neda_masteran', '9175222452', 'doctor', 'ندا', 'مستاجران', '09175222452', 'پزشک'),
            ('maryam_rashidi', '9192382249', 'doctor', 'مریم', 'رشیدی', '09192382249', 'پزشک'),
            ('anahita_falahian', '9356947544', 'doctor', 'آناهیتا', 'فلاحیان', '09356947544', 'پزشک'),
            ('atefeh_heidari', '9164337836', 'doctor', 'عاطفه', 'حیدری', '09164337836', 'پزشک'),
            ('mohammad_taheri', '9001577080', 'doctor', 'محمد', 'طاهری', '09001577080', 'پزشک'),
            ('shirin_hamzeii', '9046894412', 'doctor', 'شیرین', 'حمزه‌ای', '09046894412', 'پزشک'),
            ('mina_moradi', '9397197577', 'doctor', 'مینا', 'مرادی', '09397197577', 'پزشک'),
            ('tahereh_naimi', '9014086009', 'reception', 'طاهره', 'نعیمی', '09014086009', 'پذیرش'),
        ]:
            if role == 'admin':
                perms = ALL_PERMISSIONS
            elif role in ('doctor', 'psychologist') and username in LIMITED_DOCTORS:
                perms = DOCTOR_LIMITED_PERMS
            else:
                perms = DEFAULT_ROLE_PERMISSIONS.get(role, [])
            if username in SPECIAL_ACCESS_USERS and 'special_access' not in perms:
                perms = list(perms) + ['special_access']
            try:
                user = User.objects.get(username=username)
                dirty = False
                if user.page_permissions != perms:
                    user.page_permissions = perms
                    dirty = True
                if first_name and user.first_name != first_name:
                    user.first_name = first_name
                    dirty = True
                if last_name and user.last_name != last_name:
                    user.last_name = last_name
                    dirty = True
                if phone and user.phone != phone:
                    user.phone = phone
                    dirty = True
                if user.role != role:
                    user.role = role
                    dirty = True
                if dirty:
                    user.save(update_fields=['page_permissions', 'first_name', 'last_name', 'phone', 'role'])
                    changes.append(f'{username} profile updated')
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=username, password=password,
                    role=role, is_active=True,
                    profile_completed=False,
                    page_permissions=perms,
                )
                if first_name:
                    user.first_name = first_name
                if last_name:
                    user.last_name = last_name
                if phone:
                    user.phone = phone
                if first_name or last_name or phone:
                    user.save(update_fields=['first_name', 'last_name', 'phone'])
                changes.append(f'{username} ({label}) created')
            if username in LIMITED_DOCTORS and user.commission_percentage != 60:
                user.commission_percentage = 60
                user.save(update_fields=['commission_percentage'])
                if f'{username} commission set to 60%' not in changes:
                    changes.append(f'{username} commission set to 60%')

        cs, created = ClinicSetting.objects.get_or_create(pk=1)
        cs.clinic_name = 'کلینیک تخصصی اعصاب و روان دکتر محمد طاهری'
        cs.address = 'بندرعباس، خیابان سیدجمال اسدآبادی، کوچه جاهد ۶، جنب چاپخانه سپاهان'
        cs.phone = '07632229600'
        cs.phone2 = '07632220252'
        cs.save()
        changes.append('Clinic settings updated')

        diagnoses = [
            ('افسردگی شدید (MDD)', 'افسردگی شدید'),
            ('اختلال افسردگی خفیف (MID)', 'اختلال افسردگی خفیف'),
            ('اختلال افسردگی متوسط (MIID)', 'اختلال افسردگی متوسط'),
            ('اختلال اضطراب فراگیر (GAD)', 'اختلال اضطراب فراگیر'),
            ('اسکیزوفرنی (SCHIZOPHRENIA)', 'اسکیزوفرنی'),
            ('اختلال پانیک (PANIC DISORDER)', 'اختلال پانیک'),
            ('بیش‌فعالی-نقص توجه (ADHD)', 'بیش‌فعالی-نقص توجه'),
            ('اوتیسم (AUTISM)', 'اوتیسم'),
        ]
        for title, desc in diagnoses:
            CommonDiagnosis.objects.get_or_create(title=title, defaults={'description': desc, 'is_active': True})
        changes.append('Common diagnoses seeded')

        if changes:
            self.stdout.write(self.style.SUCCESS('\n'.join(changes)))
        else:
            self.stdout.write('Default users OK')
