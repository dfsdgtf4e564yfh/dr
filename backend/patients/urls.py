from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, ReferralLetterViewSet, SupportMessageViewSet, PatientTagViewSet, PatientTagAssignmentViewSet

router = DefaultRouter()
router.register('referrals', ReferralLetterViewSet)
router.register('support-messages', SupportMessageViewSet)
router.register('tags', PatientTagViewSet)
router.register('tag-assignments', PatientTagAssignmentViewSet)
router.register('', PatientViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
