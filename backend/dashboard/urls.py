from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.dashboard_stats, name='dashboard-stats'),
    path('monthly-income/', views.monthly_income_chart, name='monthly-income'),
    path('doctor-income/', views.doctor_income_pie, name='doctor-income'),
    path('patients-trend/', views.patients_trend, name='patients-trend'),
    path('alerts/', views.alerts, name='alerts'),
    path('notifications/', views.notifications, name='notifications'),
    path('notifications/create/', views.create_notification, name='create-notification'),
    path('work-year/', views.work_year_info, name='work-year'),
]
