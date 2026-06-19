from django.contrib import admin
from .models import Holiday, ClinicConfig


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ['date', 'reason', 'is_active']
    list_filter = ['is_active']
    search_fields = ['reason']


@admin.register(ClinicConfig)
class ClinicConfigAdmin(admin.ModelAdmin):
    list_display = ['key', 'value']
    search_fields = ['key']
