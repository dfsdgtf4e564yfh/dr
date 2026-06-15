from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, TreatmentType, DoctorTreatment, ClinicSetting


class ClinicSettingAdmin(admin.ModelAdmin):
    list_display = ['clinic_name', 'phone']
    fieldsets = [
        ('اطلاعات کلینیک', {'fields': ['clinic_name', 'logo', 'address', 'phone', 'phone2', 'phone3']}),
        ('تنظیمات پیامک', {'fields': ['sms_provider', 'sms_api_base', 'sms_line_number']}),
    ]


admin.site.register(User, UserAdmin)
admin.site.register(TreatmentType)
admin.site.register(DoctorTreatment)
admin.site.register(ClinicSetting, ClinicSettingAdmin)
