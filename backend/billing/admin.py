from django.contrib import admin
from .models import Billing, Settlement

@admin.register(Billing)
class BillingAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'total_amount', 'paid_amount', 'status']
    list_filter = ['status', 'payment_method']

@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'amount', 'date']
