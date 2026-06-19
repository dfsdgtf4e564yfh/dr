from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register('users', views.UserViewSet)
router.register('roles', views.RoleViewSet)
router.register('treatment-types', views.TreatmentTypeViewSet)
router.register('doctor-treatments', views.DoctorTreatmentViewSet)
router.register('clinic-settings', views.ClinicSettingViewSet)

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('forgot-password/send-otp/', views.forgot_password_send_otp, name='forgot-send-otp'),
    path('forgot-password/verify-otp/', views.forgot_password_verify_otp, name='forgot-verify-otp'),
    path('forgot-password/reset/', views.forgot_password_reset, name='forgot-reset'),
    path('', include(router.urls)),
]
