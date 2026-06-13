from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BillingViewSet, SettlementViewSet
from .payment_views import request_payment, payment_callback

router = DefaultRouter()
router.register('billings', BillingViewSet)
router.register('settlements', SettlementViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('request-payment/<int:billing_id>/', request_payment, name='request_payment'),
    path('payment-callback/', payment_callback, name='payment_callback'),
]
