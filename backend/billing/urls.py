from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillingViewSet, SettlementViewSet

router = DefaultRouter()
router.register('billings', BillingViewSet)
router.register('settlements', SettlementViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
