from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, ReferralLetterViewSet, SupportMessageViewSet

router = DefaultRouter()
router.register('referrals', ReferralLetterViewSet)
router.register('support-messages', SupportMessageViewSet)
router.register('', PatientViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
