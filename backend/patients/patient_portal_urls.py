from django.urls import path
from . import patient_portal_views

urlpatterns = [
    path('login/', patient_portal_views.portal_login, name='portal-login'),
    path('verify/', patient_portal_views.portal_verify_otp, name='portal-verify'),
    path('dashboard/', patient_portal_views.portal_dashboard, name='portal-dashboard'),
    path('appointments/', patient_portal_views.portal_appointments, name='portal-appointments'),
    path('records/', patient_portal_views.portal_medical_history, name='portal-records'),
    path('bills/', patient_portal_views.portal_bills, name='portal-bills'),
    path('profile/', patient_portal_views.portal_profile, name='portal-profile'),
]
