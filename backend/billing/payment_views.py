from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Billing
from .payment_gateway import ZarinpalGateway


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_payment(request, billing_id):
    try:
        billing = Billing.objects.get(id=billing_id, is_deleted=False)
    except Billing.DoesNotExist:
        return Response({'error': 'صورتحساب یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    if billing.status == 'paid':
        return Response({'error': 'این صورتحساب قبلاً پرداخت شده است'}, status=status.HTTP_400_BAD_REQUEST)

    gateway = ZarinpalGateway()
    callback_url = request.build_absolute_uri(reverse('payment_callback'))
    description = f"پرداخت صورتحساب {billing.id} - {billing.patient}"
    authority, payment_url = gateway.payment_request(
        amount=billing.total_amount,
        description=description,
        callback_url=callback_url,
        patient_id=billing.patient_id,
        billing_id=billing.id,
    )

    if not authority:
        return Response({'error': 'خطا در اتصال به درگاه پرداخت'}, status=status.HTTP_502_BAD_GATEWAY)

    billing.authority = authority
    billing.payment_url = payment_url
    billing.save(update_fields=['authority', 'payment_url'])

    return Response({'authority': authority, 'payment_url': payment_url})


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_callback(request):
    authority = request.GET.get('Authority')
    status_val = request.GET.get('Status')

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')

    if status_val != 'OK' or not authority:
        return redirect(f'{frontend_url}/billing?payment_status=fail')

    try:
        billing = Billing.objects.get(authority=authority, is_deleted=False)
    except Billing.DoesNotExist:
        return redirect(f'{frontend_url}/billing?payment_status=fail')

    gateway = ZarinpalGateway()
    ref_id, success = gateway.payment_verify(authority, int(billing.total_amount))

    if success:
        billing.ref_id = ref_id
        billing.paid_amount = billing.total_amount
        billing.payment_method = 'online'
        billing.status = 'paid'
        billing.save(update_fields=['ref_id', 'paid_amount', 'payment_method', 'status'])
        return redirect(f'{frontend_url}/billing?payment_status=success&ref_id={ref_id}')
    else:
        return redirect(f'{frontend_url}/billing?payment_status=fail')
