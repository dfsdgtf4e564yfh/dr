from django.contrib import admin
from .models import MedicalRecord, MedicalRecordFile, AuditLog, TmsForm, VisitTemplate

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'session_number', 'date']

@admin.register(MedicalRecordFile)
class MedicalRecordFileAdmin(admin.ModelAdmin):
    list_display = ['medical_record', 'description', 'uploaded_at']

@admin.register(TmsForm)
class TmsFormAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'date']
    list_filter = ['date']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'model_name', 'timestamp']
    list_filter = ['action', 'model_name']


@admin.register(VisitTemplate)
class VisitTemplateAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_active', 'created_by', 'created_at']
    list_filter = ['category', 'is_active']
