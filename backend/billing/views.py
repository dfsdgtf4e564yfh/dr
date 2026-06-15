import csv
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta, date
from reportlab.lib.units import cm
import jdatetime
from accounts.views import IsAdmin
from .models import Billing, Settlement
from .payment_gateway import ZarinpalGateway
from medical_records.models import AuditLog
from .serializers import (
    BillingSerializer, BillingCreateSerializer,
    SettlementSerializer, SettlementCreateSerializer,
)


class BillingViewSet(viewsets.ModelViewSet):
    queryset = Billing.objects.select_related('patient', 'doctor').filter(is_deleted=False).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return BillingCreateSerializer
        return BillingSerializer

    def get_permissions(self):
        if self.action in ('restore_all', 'permanent_delete_all'):
            return [IsAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        qs = Billing.objects.select_related('patient', 'doctor').filter(is_deleted=False).order_by('-created_at')
        user = self.request.user
        if user.is_doctor_like:
            qs = qs.filter(doctor=user)
        elif user.role == 'rtms':
            qs = qs.filter(created_by=user)

        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        doctor_id = self.request.query_params.get('doctor')
        patient_id = self.request.query_params.get('patient')
        appointment_id = self.request.query_params.get('appointment')
        status_param = self.request.query_params.get('status')

        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        if appointment_id:
            qs = qs.filter(appointment_id=appointment_id)
        if status_param:
            qs = qs.filter(status=status_param)

        return qs

    def perform_create(self, serializer):
        billing = serializer.save(created_by=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='Billing',
            object_id=billing.id,
            details={
                'patient': str(billing.patient),
                'total_amount': str(billing.total_amount),
                'status': billing.status,
            }
        )

    def perform_update(self, serializer):
        billing = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='update',
            model_name='Billing',
            object_id=billing.id,
            details={
                'patient': str(billing.patient),
                'total_amount': str(billing.total_amount),
                'status': billing.status,
            }
        )

    def perform_destroy(self, instance):
        patient_name = str(instance.patient)
        instance.soft_delete(user=self.request.user)
        AuditLog.objects.create(
            user=self.request.user,
            action='deleted',
            model_name='Billing',
            object_id=instance.id,
            details={'patient': patient_name, 'total_amount': str(instance.total_amount)}
        )

    @action(detail=False, methods=['get'])
    def deleted(self, request):
        qs = Billing.objects.filter(is_deleted=True).select_related('patient', 'doctor').order_by('-deleted_at')
        user = request.user
        if user.is_doctor_like:
            qs = qs.filter(doctor=user)
        elif user.role == 'rtms':
            qs = qs.filter(created_by=user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = BillingSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = BillingSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        billing = Billing.objects.filter(id=pk, is_deleted=True).first()
        if not billing:
            return Response({'error': 'صورتحساب یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        billing.restore()
        AuditLog.objects.create(
            user=self.request.user,
            action='restore',
            model_name='Billing',
            object_id=billing.id,
            details={'patient': str(billing.patient), 'total_amount': str(billing.total_amount)}
        )
        return Response(BillingSerializer(billing).data)

    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        billing = Billing.objects.filter(id=pk, is_deleted=True).first()
        if not billing:
            return Response({'error': 'صورتحساب یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        patient_name = str(billing.patient)
        billing.delete()
        AuditLog.objects.create(
            user=self.request.user,
            action='permanent_delete',
            model_name='Billing',
            object_id=pk,
            details={'patient': patient_name, 'total_amount': str(billing.total_amount)}
        )
        return Response({'message': 'صورتحساب برای همیشه حذف شد'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def restore_all(self, request):
        count = Billing.objects.filter(is_deleted=True).update(is_deleted=False, deleted_at=None, deleted_by=None)
        return Response({'restored': count, 'message': f'{count} صورتحساب بازیابی شدند'})

    @action(detail=False, methods=['delete'])
    def permanent_delete_all(self, request):
        qs = Billing.objects.filter(is_deleted=True)
        count = qs.count()
        qs.delete()
        return Response({'deleted': count, 'message': f'{count} صورتحساب برای همیشه حذف شدند'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def report(self, request):
        period = request.query_params.get('period', 'monthly')
        today = timezone.localdate()
        user = self.request.user

        if period == 'daily':
            start_date = today
        elif period == 'weekly':
            start_date = today - timedelta(days=today.weekday())
        elif period == 'yearly':
            start_date = today.replace(month=1, day=1)
        else:
            start_date = today.replace(day=1)

        end_date_str = request.query_params.get('end_date')
        end_date = date.fromisoformat(end_date_str) if end_date_str else today

        billings = Billing.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date, is_deleted=False)
        if user.is_doctor_like:
            billings = billings.filter(doctor=user)
        elif user.role == 'rtms':
            billings = billings.filter(created_by=user)

        total_income = billings.aggregate(s=Sum('total_amount'))['s'] or 0
        total_paid = billings.aggregate(s=Sum('paid_amount'))['s'] or 0
        total_pending = total_income - total_paid

        doctor_incomes = billings.values('doctor__first_name', 'doctor__last_name').annotate(
            total=Sum('total_amount'),
            paid=Sum('paid_amount'),
            share=Sum('doctor_share')
        )

        doctor_income_list = []
        for d in doctor_incomes:
            doctor_income_list.append({
                'doctor_name': f"{d['doctor__first_name']} {d['doctor__last_name']}",
                'total': d['total'],
                'paid': d['paid'],
                'share': d['share'],
            })

        return Response({
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': end_date,
            'total_income': total_income,
            'total_paid': total_paid,
            'total_pending': total_pending,
            'doctor_incomes': doctor_income_list,
        })

    @action(detail=False, methods=['get'])
    def report_pdf(self, request):
        from utils.pdf_generator import ReportPDF

        period = request.query_params.get('period', 'monthly')
        today = timezone.localdate()
        user = self.request.user

        if period == 'daily':
            start_date = today
        elif period == 'weekly':
            start_date = today - timedelta(days=today.weekday())
        elif period == 'yearly':
            start_date = today.replace(month=1, day=1)
        else:
            start_date = today.replace(day=1)

        end_date_str = request.query_params.get('end_date')
        end_date = date.fromisoformat(end_date_str) if end_date_str else today

        billings = Billing.objects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date, is_deleted=False)
        if user.is_doctor_like:
            billings = billings.filter(doctor=user)
        elif user.role == 'rtms':
            billings = billings.filter(created_by=user)

        total_income = billings.aggregate(s=Sum('total_amount'))['s'] or 0
        total_paid = billings.aggregate(s=Sum('paid_amount'))['s'] or 0
        total_pending = total_income - total_paid

        doctor_incomes = billings.values('doctor__first_name', 'doctor__last_name').annotate(
            total=Sum('total_amount'), paid=Sum('paid_amount'), share=Sum('doctor_share')
        )

        period_labels = {'daily': 'روزانه', 'weekly': 'هفتگی', 'monthly': 'ماهیانه', 'yearly': 'ساالنه'}
        pdf = ReportPDF('گزارش مالی', f'گزارش {period_labels.get(period, period)}')
        pdf.add_info_row('دوره', period_labels.get(period, period))
        pdf.add_info_row('از تاریخ', jdatetime.date.fromgregorian(date=start_date).strftime('%Y/%m/%d'))
        pdf.add_info_row('تا تاریخ', jdatetime.date.fromgregorian(date=end_date).strftime('%Y/%m/%d'))

        cards = [
            ('درآمد کل', f'{total_income:,} تومان', '#2563eb'),
            ('پرداخت شده', f'{total_paid:,} تومان', '#10b981'),
            ('باقی‌مانده', f'{total_pending:,} تومان', '#f59e0b'),
        ]
        pdf.add_summary_cards(cards)

        if doctor_incomes:
            doc_data = [d['total'] or 0 for d in doctor_incomes]
            doc_labels = [f"{d['doctor__first_name']} {d['doctor__last_name']}"[:15] for d in doctor_incomes]
            pdf.add_bar_chart(doc_data, doc_labels, 'درآمد پزشکان')

        pdf.add_heading('جزئیات درآمد پزشکان')
        pdf.add_table(
            ['ردیف', 'پزشک', 'درآمد کل', 'پرداخت شده', 'سهم پزشک'],
            [[i + 1, f"{d['doctor__first_name']} {d['doctor__last_name']}",
              f'{d["total"] or 0:,}', f'{d["paid"] or 0:,}', f'{d["share"] or 0:,}']
             for i, d in enumerate(doctor_incomes)],
            [1.2 * cm, 4 * cm, 3 * cm, 3 * cm, 3 * cm]
        )

        pdf.add_doctor_signature(user.get_full_name())

        buf = pdf.build()
        response = HttpResponse(content_type='application/pdf')
        js = jdatetime.date.fromgregorian(date=start_date).strftime('%Y%m%d')
        je = jdatetime.date.fromgregorian(date=end_date).strftime('%Y%m%d')
        response['Content-Disposition'] = f'attachment; filename="financial_report_{js}_{je}.pdf"'
        response.write(buf.read())
        return response

    @action(detail=False, methods=['get'])
    def doctor_balance(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = self.request.user
        if user.is_doctor_like:
            doctors = User.objects.filter(id=user.id)
        elif user.role == 'rtms':
            doctors = User.objects.filter(role__in=['doctor', 'psychologist', 'rtms'])
        else:
            doctors = User.objects.filter(role__in=['doctor', 'psychologist'])

        result = []
        for doctor in doctors:
            billings = Billing.objects.filter(doctor=doctor, is_deleted=False)
            total_share = billings.aggregate(s=Sum('doctor_share'))['s'] or 0
            total_settled = Settlement.objects.filter(doctor=doctor).aggregate(s=Sum('amount'))['s'] or 0
            visit_share = billings.filter(cost_type='visit').aggregate(s=Sum('doctor_share'))['s'] or 0
            service_share = billings.filter(cost_type='service').aggregate(s=Sum('doctor_share'))['s'] or 0
            balance = total_share - total_settled
            result.append({
                'doctor_id': doctor.id,
                'doctor_name': doctor.get_full_name(),
                'total_share': total_share,
                'visit_share': visit_share,
                'service_share': service_share,
                'total_settled': total_settled,
                'balance': balance,
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="billings.csv"'
        writer = csv.writer(response)
        writer.writerow(['بیمار', 'پزشک', 'مبلغ کل', 'پرداختی', 'معوقه', 'سهم پزشک', 'وضعیت', 'یادداشت', 'تاریخ'])
        for b in self.get_queryset().iterator(chunk_size=200):
            writer.writerow([str(b.patient), b.doctor.get_full_name(), b.total_amount, b.paid_amount, b.total_amount - b.paid_amount, b.doctor_share, b.get_status_display(), b.description or '', str(b.created_at.date())])
        return response

    @action(detail=True, methods=['post'])
    def pay_online(self, request, pk=None):
        billing = self.get_object()
        if billing.status == 'paid':
            return Response({'error': 'این صورتحساب قبلاً پرداخت شده است'}, status=status.HTTP_400_BAD_REQUEST)

        gateway = ZarinpalGateway()
        callback_url = request.build_absolute_uri(
            request.build_absolute_uri('/')[:-1].rstrip('/') + '/api/billing/payment-callback/'
        )
        description = f"پرداخت صورتحساب {billing.id}"
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

    @action(detail=False, methods=['post'])
    def pay_balance(self, request):
        patient_id = request.data.get('patient_id')
        amount = request.data.get('amount', 0)
        payment_method = request.data.get('payment_method', 'cash')
        receipt_number = request.data.get('receipt_number', '')

        if not patient_id or not amount:
            return Response({'error': 'patient_id و amount الزامی است'}, status=status.HTTP_400_BAD_REQUEST)

        billings = Billing.objects.filter(
            patient_id=patient_id, is_deleted=False
        ).exclude(status='paid').order_by('created_at')

        remaining = int(amount)
        updated = []

        for billing in billings:
            if remaining <= 0:
                break
            due = billing.total_amount - billing.paid_amount
            if due <= 0:
                continue
            payment = min(remaining, due)
            billing.paid_amount += payment
            billing.payment_method = payment_method
            if receipt_number:
                billing.receipt_number = receipt_number
            billing.save()
            remaining -= payment
            updated.append({
                'billing_id': billing.id,
                'paid': payment,
                'status': billing.status,
            })

        return Response({
            'paid': int(amount) - remaining,
            'remaining_balance': remaining,
            'updated_billings': updated,
        })


class SettlementViewSet(viewsets.ModelViewSet):
    queryset = Settlement.objects.select_related('doctor').all().order_by('-date')

    def get_serializer_class(self):
        if self.action == 'create':
            return SettlementCreateSerializer
        return SettlementSerializer

    def get_queryset(self):
        qs = Settlement.objects.select_related('doctor').all().order_by('-date')
        user = self.request.user
        if user.is_doctor_like:
            qs = qs.filter(doctor=user)
        elif user.role == 'rtms':
            qs = qs.filter(created_by=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def history(self, request):
        doctor_id = request.query_params.get('doctor')
        qs = self.get_queryset()
        if doctor_id and not self.request.user.is_doctor_like:
            qs = qs.filter(doctor_id=doctor_id)
        serializer = SettlementSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def doctor_balance(self, request):
        doctor_id = request.query_params.get('doctor')
        if not doctor_id:
            return Response({'error': 'doctor parameter is required'}, status=400)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        from django.db.models import Sum
        try:
            doctor = User.objects.get(id=doctor_id)
        except User.DoesNotExist:
            return Response({'error': 'doctor not found'}, status=404)
        billings = Billing.objects.filter(doctor=doctor, is_deleted=False)
        total_share = billings.aggregate(s=Sum('doctor_share'))['s'] or 0
        total_settled = Settlement.objects.filter(doctor=doctor).aggregate(s=Sum('amount'))['s'] or 0
        balance = total_share - total_settled
        return Response({
            'doctor_id': doctor.id,
            'doctor_name': doctor.get_full_name(),
            'total_share': total_share,
            'total_settled': total_settled,
            'balance': balance,
        })
