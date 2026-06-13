from django.urls import path
from . import views
from . import messenger_views

urlpatterns = [
    path('send-confirm/', views.send_confirm, name='sms-send-confirm'),
    path('send-reminder/', views.send_reminder, name='sms-send-reminder'),
    path('send-payment-notice/', views.send_payment_notice, name='sms-payment-notice'),
    path('settings/', views.sms_settings, name='sms-settings'),
    path('test/', views.test_sms_connection, name='sms-test'),
    path('credit/', views.sms_credit, name='sms-credit'),
    path('otp/', views.sms_otp, name='sms-otp'),
    path('delivery/', views.sms_delivery, name='sms-delivery'),
    path('check-pending/', views.sms_check_pending, name='sms-check-pending'),
    path('templates/', views.sms_template_list, name='sms-template-list'),
    path('templates/<int:pk>/', views.sms_template_detail, name='sms-template-detail'),
    path('logs/', views.sms_log_list, name='sms-log-list'),
    path('method-info/', views.sms_method_info, name='sms-method-info'),
    path('messenger-settings/', messenger_views.messenger_settings, name='messenger-settings'),
    path('send-messenger/', messenger_views.send_messenger_message, name='send-messenger'),
    path('test-messenger/', messenger_views.test_messenger, name='test-messenger'),
]
