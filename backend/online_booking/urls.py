from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('clinic-info/', views.clinic_info, name='clinic-info'),
    path('services/', views.service_list, name='service-list'),
    path('patient-lookup/', views.patient_lookup, name='patient-lookup'),
    path('available-times/', views.available_times, name='available-times'),
    path('create-booking/', views.create_booking, name='create-booking'),

    # Admin
    path('holidays/', views.holiday_list, name='holiday-list'),
    path('holidays/<int:pk>/', views.holiday_detail, name='holiday-detail'),
    path('settings/', views.clinic_settings, name='clinic-settings'),
    path('report/', views.booking_report, name='booking-report'),
    path('payment-callback/', views.payment_callback, name='payment-callback'),
]
