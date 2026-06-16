from django.contrib import admin
from .models import Patient

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'national_id', 'phone', 'file_number', 'education', 'job', 'is_deleted', 'created_at']
    search_fields = ['first_name', 'last_name', 'national_id', 'phone', 'file_number']
    list_filter = ['is_deleted', 'education', 'gender']
