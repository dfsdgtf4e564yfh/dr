from django.db import migrations


ROLE_DATA = [
    ('admin', 'مدیر کلینیک', True),
    ('reception', 'پذیرش', True),
    ('doctor', 'درمانگر', True),
    ('psychologist', 'روانشناس / درمانگر', True),
    ('rtms', 'کاربر ویژه', True),
    ('support', 'پشتیبانی', True),
    ('super_support', 'پشتیبانی ارشد', True),
]


def get_default_permissions():
    ALL_PAGES = [
        {'codename': 'dashboard', 'name': 'داشبورد', 'group': 'عمومی'},
        {'codename': 'dashboard_income', 'name': 'نمایش درآمد در داشبورد', 'group': 'عمومی'},
        {'codename': 'special_access', 'name': 'کاربر ویژه', 'group': 'عمومی'},
        {'codename': 'patients', 'name': 'مدیریت بیماران', 'group': 'بیماران'},
        {'codename': 'patient_create', 'name': 'ثبت بیمار جدید', 'group': 'بیماران'},
        {'codename': 'patient_view', 'name': 'مشاهده اطلاعات بیمار', 'group': 'بیماران'},
        {'codename': 'patient_edit', 'name': 'ویرایش اطلاعات بیمار', 'group': 'بیماران'},
        {'codename': 'patient_delete', 'name': 'حذف بیمار', 'group': 'بیماران'},
        {'codename': 'patient_info', 'name': 'اطلاعات فردی بیمار', 'group': 'بیماران'},
        {'codename': 'patient_appointments', 'name': 'نوبت‌های بیمار', 'group': 'بیماران'},
        {'codename': 'patient_records', 'name': 'پرونده پزشکی در بیمار', 'group': 'بیماران'},
        {'codename': 'patient_billing', 'name': 'صورتحساب در بیمار', 'group': 'بیماران'},
        {'codename': 'patient_tags', 'name': 'برچسب‌های بیمار', 'group': 'بیماران'},
        {'codename': 'patient_import', 'name': 'ورود اطلاعات از اکسل', 'group': 'بیماران'},
        {'codename': 'patient_export', 'name': 'خروجی اکسل بیماران', 'group': 'بیماران'},
        {'codename': 'patient_ocr', 'name': 'اسکن کارت ملی (OCR)', 'group': 'بیماران'},
        {'codename': 'patient_deleted_view', 'name': 'مشاهده بیماران حذف شده', 'group': 'بیماران'},
        {'codename': 'patient_restore', 'name': 'بازیابی بیمار حذف شده', 'group': 'بیماران'},
        {'codename': 'patient_permanent_delete', 'name': 'حذف دائمی بیمار', 'group': 'بیماران'},
        {'codename': 'patient_identity_view', 'name': 'مشاهده هویت بیمار', 'group': 'بیماران'},
        {'codename': 'patient_identity_edit', 'name': 'ویرایش هویت بیمار', 'group': 'بیماران'},
        {'codename': 'patient_identity_verify', 'name': 'تأیید هویت بیمار', 'group': 'بیماران'},
        {'codename': 'appointments', 'name': 'نوبت‌ها', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_create', 'name': 'ثبت نوبت جدید', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_edit', 'name': 'ویرایش نوبت', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_cancel', 'name': 'لغو نوبت', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_complete', 'name': 'اتمام نوبت', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_reschedule', 'name': 'تغییر زمان نوبت', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_delete', 'name': 'حذف نوبت', 'group': 'نوبت‌ها'},
        {'codename': 'appointments_calendar', 'name': 'تقویم نوبت‌ها', 'group': 'نوبت‌ها'},
        {'codename': 'waiting_list', 'name': 'لیست انتظار', 'group': 'نوبت‌ها'},
        {'codename': 'appointments_report', 'name': 'گزارش نوبت‌ها', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_sms_confirm', 'name': 'ارسال پیامک تأیید نوبت', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_sms_reminder', 'name': 'ارسال پیامک یادآوری نوبت', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_public_booking', 'name': 'رزرو عمومی نوبت', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_online_import', 'name': 'ورود نوبت از سیستم خارجی', 'group': 'نوبت‌ها'},
        {'codename': 'appointment_export', 'name': 'خروجی اکسل نوبت‌ها', 'group': 'نوبت‌ها'},
        {'codename': 'calendar_view', 'name': 'تقویم شمسی', 'group': 'نوبت‌ها'},
        {'codename': 'medical_records', 'name': 'پرونده پزشکی', 'group': 'پزشکی'},
        {'codename': 'medical_record_create', 'name': 'ثبت پرونده پزشکی', 'group': 'پزشکی'},
        {'codename': 'medical_record_edit', 'name': 'ویرایش پرونده پزشکی', 'group': 'پزشکی'},
        {'codename': 'medical_record_delete', 'name': 'حذف پرونده پزشکی', 'group': 'پزشکی'},
        {'codename': 'medical_record_file_upload', 'name': 'بارگذاری فایل در پرونده', 'group': 'پزشکی'},
        {'codename': 'medical_record_voice', 'name': 'دیکته صوتی یادداشت', 'group': 'پزشکی'},
        {'codename': 'medical_record_templates', 'name': 'قالب‌های اختصاصی ویزیت', 'group': 'پزشکی'},
        {'codename': 'visit_templates', 'name': 'قالب‌های ویزیت', 'group': 'پزشکی'},
        {'codename': 'visit_templates_apply', 'name': 'اعمال قالب ویزیت', 'group': 'پزشکی'},
        {'codename': 'doctor_finance', 'name': 'حساب پزشکان', 'group': 'پزشکی'},
        {'codename': 'referral_letters', 'name': 'نامه‌های ارجاع', 'group': 'پزشکی'},
        {'codename': 'referral_letter_create', 'name': 'ایجاد نامه ارجاع', 'group': 'پزشکی'},
        {'codename': 'diagnosis_report', 'name': 'گزارش تشخیص', 'group': 'پزشکی'},
        {'codename': 'diagnosis_drugs', 'name': 'تشخیص و دارو', 'group': 'پزشکی'},
        {'codename': 'common_diagnosis_manage', 'name': 'مدیریت تشخیص‌های آماده', 'group': 'پزشکی'},
        {'codename': 'common_drug_manage', 'name': 'مدیریت داروهای آماده', 'group': 'پزشکی'},
        {'codename': 'common_treatment_manage', 'name': 'مدیریت طرح‌های درمان آماده', 'group': 'پزشکی'},
        {'codename': 'tms_forms', 'name': 'فرم TMS', 'group': 'پزشکی'},
        {'codename': 'tms_form_create', 'name': 'ثبت فرم TMS', 'group': 'پزشکی'},
        {'codename': 'tms_form_edit', 'name': 'ویرایش فرم TMS', 'group': 'پزشکی'},
        {'codename': 'dicom_viewer', 'name': 'نمایش تصاویر پزشکی (DICOM)', 'group': 'پزشکی'},
        {'codename': 'prescription_print', 'name': 'چاپ نسخه', 'group': 'پزشکی'},
        {'codename': 'medical_record_export', 'name': 'خروجی CSV پرونده', 'group': 'پزشکی'},
        {'codename': 'billing', 'name': 'صورتحساب', 'group': 'مالی'},
        {'codename': 'billing_create', 'name': 'ثبت صورت‌حساب', 'group': 'مالی'},
        {'codename': 'billing_edit', 'name': 'ویرایش صورت‌حساب', 'group': 'مالی'},
        {'codename': 'billing_delete', 'name': 'حذف صورت‌حساب', 'group': 'مالی'},
        {'codename': 'billing_payment', 'name': 'ثبت پرداخت', 'group': 'مالی'},
        {'codename': 'billing_report', 'name': 'گزارش مالی', 'group': 'مالی'},
        {'codename': 'billing_report_pdf', 'name': 'خروجی PDF گزارش مالی', 'group': 'مالی'},
        {'codename': 'billing_export', 'name': 'خروجی CSV صورت‌حساب', 'group': 'مالی'},
        {'codename': 'settlements', 'name': 'تسویه حساب', 'group': 'مالی'},
        {'codename': 'settlement_create', 'name': 'ثبت تسویه حساب', 'group': 'مالی'},
        {'codename': 'doctor_balance', 'name': 'مشاهده مانده حساب پزشکان', 'group': 'مالی'},
        {'codename': 'billing_periodic_report', 'name': 'صورتحساب دوره‌ای بیمار', 'group': 'مالی'},
        {'codename': 'periodic_billing_generate', 'name': 'ایجاد صورت‌حساب دوره‌ای', 'group': 'مالی'},
        {'codename': 'billing_receipt_print', 'name': 'چاپ رسید حرارتی', 'group': 'مالی'},
        {'codename': 'billing_online_payment', 'name': 'پرداخت اینترنتی', 'group': 'مالی'},
        {'codename': 'billing_sms_payment_notice', 'name': 'ارسال پیامک یادآوری پرداخت', 'group': 'مالی'},
        {'codename': 'notifications', 'name': 'اعلانات', 'group': 'پیامک و اعلانات'},
        {'codename': 'notification_create', 'name': 'ایجاد اعلان', 'group': 'پیامک و اعلانات'},
        {'codename': 'sms_templates', 'name': 'قالب‌های پیامک', 'group': 'پیامک و اعلانات'},
        {'codename': 'sms_templates_manage', 'name': 'مدیریت قالب‌های پیامک', 'group': 'پیامک و اعلانات'},
        {'codename': 'sms_history', 'name': 'تاریخچه پیامک‌ها', 'group': 'پیامک و اعلانات'},
        {'codename': 'sms_bulk', 'name': 'ارسال گروهی پیامک', 'group': 'پیامک و اعلانات'},
        {'codename': 'sms_settings', 'name': 'تنظیمات پیامک', 'group': 'پیامک و اعلانات'},
        {'codename': 'messenger_settings', 'name': 'تنظیمات پیام‌رسان‌ها', 'group': 'پیامک و اعلانات'},
        {'codename': 'sms_credit', 'name': 'مشاهده اعتبار پیامک', 'group': 'پیامک و اعلانات'},
        {'codename': 'messenger_eitaa', 'name': 'ارسال از طریق ایتا', 'group': 'پیامک و اعلانات'},
        {'codename': 'messenger_bale', 'name': 'ارسال از طریق بله', 'group': 'پیامک و اعلانات'},
        {'codename': 'messenger_rubika', 'name': 'ارسال از طریق روبیکا', 'group': 'پیامک و اعلانات'},
        {'codename': 'users', 'name': 'کاربران', 'group': 'مدیریت سیستم'},
        {'codename': 'user_create', 'name': 'ایجاد کاربر', 'group': 'مدیریت سیستم'},
        {'codename': 'user_edit', 'name': 'ویرایش کاربر', 'group': 'مدیریت سیستم'},
        {'codename': 'user_delete', 'name': 'حذف کاربر', 'group': 'مدیریت سیستم'},
        {'codename': 'roles_manage', 'name': 'مدیریت نقش‌ها', 'group': 'مدیریت سیستم'},
        {'codename': 'backup', 'name': 'پشتیبان', 'group': 'مدیریت سیستم'},
        {'codename': 'backup_create', 'name': 'ایجاد پشتیبان', 'group': 'مدیریت سیستم'},
        {'codename': 'backup_download', 'name': 'دانلود پشتیبان', 'group': 'مدیریت سیستم'},
        {'codename': 'backup_restore', 'name': 'بازیابی از پشتیبان', 'group': 'مدیریت سیستم'},
        {'codename': 'backup_delete', 'name': 'حذف پشتیبان', 'group': 'مدیریت سیستم'},
        {'codename': 'backup_schedule', 'name': 'تنظیم زمان پشتیبان خودکار', 'group': 'مدیریت سیستم'},
        {'codename': 'backup_cloud', 'name': 'پشتیبان‌گیری ابری', 'group': 'مدیریت سیستم'},
        {'codename': 'backup_email', 'name': 'ارسال پشتیبان از طریق ایمیل', 'group': 'مدیریت سیستم'},
        {'codename': 'settings', 'name': 'تنظیمات', 'group': 'مدیریت سیستم'},
        {'codename': 'clinic_settings', 'name': 'تنظیمات کلینیک', 'group': 'مدیریت سیستم'},
        {'codename': 'treatment_types', 'name': 'بخش‌های درمانی', 'group': 'مدیریت سیستم'},
        {'codename': 'activity_log', 'name': 'تاریخچه فعالیت‌ها', 'group': 'مدیریت سیستم'},
        {'codename': 'activity_log_export', 'name': 'خروجی تاریخچه فعالیت‌ها', 'group': 'مدیریت سیستم'},
        {'codename': 'deleted_items', 'name': 'موارد حذف شده', 'group': 'مدیریت سیستم'},
        {'codename': 'health_check', 'name': 'بررسی سلامت سیستم', 'group': 'مدیریت سیستم'},
        {'codename': 'support_inbox', 'name': 'صندوق پیام‌های پشتیبانی', 'group': 'پشتیبانی'},
        {'codename': 'support_message_create', 'name': 'ایجاد پیام پشتیبانی', 'group': 'پشتیبانی'},
        {'codename': 'support_message_reply', 'name': 'پاسخ به پیام پشتیبانی', 'group': 'پشتیبانی'},
        {'codename': 'patient_portal', 'name': 'پرتال بیمار', 'group': 'پرتال'},
        {'codename': 'patient_online_booking', 'name': 'رزرو آنلاین نوبت', 'group': 'پرتال'},
        {'codename': 'patient_online_payment', 'name': 'پرداخت آنلاین', 'group': 'پرتال'},
        {'codename': 'patient_consent', 'name': 'رضایت‌نامه الکترونیکی', 'group': 'پرتال'},
        {'codename': 'patient_rating', 'name': 'ثبت نظر و امتیاز', 'group': 'پرتال'},
        {'codename': 'show_appointments_menu', 'name': 'نمایش منوی نوبت‌ها', 'group': 'نمایش منوها'},
        {'codename': 'show_medical_menu', 'name': 'نمایش منوی پزشکی', 'group': 'نمایش منوها'},
        {'codename': 'show_financial_menu', 'name': 'نمایش منوی مالی', 'group': 'نمایش منوها'},
        {'codename': 'show_system_menu', 'name': 'نمایش منوی مدیریت سیستم', 'group': 'نمایش منوها'},
        {'codename': 'show_forms_menu', 'name': 'نمایش منوی فرم‌ها', 'group': 'نمایش منوها'},
    ]
    ALL_CODENAMES = [p['codename'] for p in ALL_PAGES]

    DEFAULT_ROLE_PERMISSIONS = {
        'admin': ALL_CODENAMES,
        'super_support': ALL_CODENAMES,
        'support': ALL_CODENAMES,
        'reception': ['dashboard', 'patients', 'patient_info', 'patient_appointments',
                      'patient_billing', 'patient_create', 'patient_view', 'patient_edit',
                      'appointments', 'appointment_create', 'appointment_edit', 'appointment_cancel',
                      'appointments_calendar', 'waiting_list', 'billing', 'billing_payment',
                      'billing_create', 'doctor_finance', 'settlements',
                      'notifications', 'show_appointments_menu', 'show_financial_menu'],
        'doctor': ['dashboard', 'dashboard_income', 'patients', 'patient_info',
                   'patient_appointments', 'patient_records', 'patient_billing',
                   'patient_create', 'patient_view', 'patient_edit', 'patient_tags',
                   'appointments', 'appointment_create', 'appointment_edit',
                   'appointments_calendar', 'waiting_list',
                   'medical_records', 'medical_record_create', 'medical_record_edit',
                   'medical_record_file_upload', 'medical_record_templates',
                   'doctor_finance', 'referral_letters', 'referral_letter_create',
                   'diagnosis_report', 'diagnosis_drugs', 'common_diagnosis_manage',
                   'common_drug_manage', 'common_treatment_manage',
                   'tms_forms', 'tms_form_create', 'tms_form_edit',
                   'prescription_print', 'dicom_viewer',
                   'billing', 'billing_payment', 'billing_sms_payment_notice',
                   'notifications', 'show_appointments_menu', 'show_medical_menu',
                   'show_financial_menu', 'show_forms_menu'],
        'psychologist': ['dashboard', 'dashboard_income', 'patients', 'patient_info',
                         'patient_appointments', 'patient_records', 'patient_billing',
                         'patient_create', 'patient_view', 'patient_edit', 'patient_tags',
                         'appointments', 'appointment_create', 'appointment_edit',
                         'appointments_calendar', 'waiting_list',
                         'medical_records', 'medical_record_create', 'medical_record_edit',
                         'medical_record_file_upload', 'medical_record_templates',
                         'doctor_finance', 'referral_letters', 'referral_letter_create',
                         'diagnosis_report', 'diagnosis_drugs',
                         'prescription_print',
                         'notifications', 'show_appointments_menu', 'show_medical_menu',
                         'show_financial_menu'],
        'rtms': ['dashboard', 'patients', 'patient_info',
                 'patient_appointments', 'patient_billing',
                 'patient_create', 'patient_view', 'patient_edit',
                 'appointments', 'appointments_calendar', 'waiting_list',
                 'medical_records', 'medical_record_create', 'medical_record_edit',
                 'doctor_finance', 'referral_letters',
                 'diagnosis_report', 'diagnosis_drugs',
                 'tms_forms', 'tms_form_create', 'tms_form_edit',
                 'notifications', 'show_appointments_menu', 'show_medical_menu',
                 'show_forms_menu'],
    }
    return DEFAULT_ROLE_PERMISSIONS


def seed_roles(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    User = apps.get_model('accounts', 'User')

    DEFAULT_ROLE_PERMISSIONS = get_default_permissions()
    existing_names = set(Role.objects.values_list('name', flat=True))

    for role_name, description, is_system in ROLE_DATA:
        if role_name not in existing_names:
            Role.objects.create(
                name=role_name,
                description=description,
                permissions=DEFAULT_ROLE_PERMISSIONS.get(role_name, []),
                is_system_role=is_system,
                is_active=True,
            )

    admin_user = User.objects.filter(is_superuser=True).first()
    if admin_user:
        Role.objects.filter(created_by__isnull=True).update(created_by=admin_user)


def reverse_seed(apps, schema_editor):
    Role = apps.get_model('accounts', 'Role')
    Role.objects.filter(name__in=[name for name, _, _ in ROLE_DATA]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0024_treatmenttype_price'),
    ]

    operations = [
        migrations.RunPython(seed_roles, reverse_seed),
    ]
