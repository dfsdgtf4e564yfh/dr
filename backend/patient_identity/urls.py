from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientIdentityViewSet

router = DefaultRouter()
router.register('identities', PatientIdentityViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
