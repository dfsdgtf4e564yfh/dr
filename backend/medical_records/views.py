import csv
import os
from io import BytesIO
from django.http import HttpResponse
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import MedicalRecord, AuditLog, CommonDiagnosis, CommonDrug, CommonTreatmentPlan, TmsForm, VisitTemplate, DicomFile
from .serializers import (MedicalRecordSerializer, AuditLogSerializer, CommonDiagnosisSerializer,
                          CommonDrugSerializer, CommonTreatmentPlanSerializer, TmsFormSerializer,
                          VisitTemplateSerializer, DicomFileSerializer)
from .audio_utils import save_audio_file, transcribe_audio
from .dicom_utils import save_dicom_file, parse_dicom_metadata, generate_thumbnail


class IsDoctorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['doctor', 'psychologist', 'admin', 'rtms']

    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'rtms'):
            return True
        return obj.doctor == request.user


class CommonDiagnosisViewSet(viewsets.ModelViewSet):
    queryset = CommonDiagnosis.objects.all()
    serializer_class = CommonDiagnosisSerializer

    def get_queryset(self):
        if self.action == 'list':
            return CommonDiagnosis.objects.filter(is_active=True)
        return CommonDiagnosis.objects.all()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class CommonDrugViewSet(viewsets.ModelViewSet):
    queryset = CommonDrug.objects.all()
    serializer_class = CommonDrugSerializer

    def get_queryset(self):
        if self.action == 'list':
            return CommonDrug.objects.filter(is_active=True)
        return CommonDrug.objects.all()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class CommonTreatmentPlanViewSet(viewsets.ModelViewSet):
    queryset = CommonTreatmentPlan.objects.all()
    serializer_class = CommonTreatmentPlanSerializer

    def get_queryset(self):
        if self.action == 'list':
            return CommonTreatmentPlan.objects.filter(is_active=True)
        return CommonTreatmentPlan.objects.all()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.select_related(
        'patient', 'doctor', 'appointment'
    ).prefetch_related('files').filter(is_deleted=False).order_by('-date', '-session_number')
    serializer_class = MedicalRecordSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsDoctorOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = MedicalRecord.objects.select_related(
            'patient', 'doctor', 'appointment'
        ).prefetch_related('files').filter(is_deleted=False).order_by('-date', '-session_number')

        user = self.request.user
        if user.is_doctor_like:
            qs = qs.filter(doctor=user)
        elif user.role == 'rtms':
            qs = qs.filter(created_by=user)

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)

        doctor_id = self.request.query_params.get('doctor')
        if doctor_id and user.role in ('admin', 'rtms'):
            qs = qs.filter(doctor_id=doctor_id)

        return qs

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)

    @action(detail=False, methods=['get'])
    def deleted(self, request):
        qs = MedicalRecord.objects.filter(is_deleted=True).select_related('patient', 'doctor').prefetch_related('files').order_by('-deleted_at')
        user = request.user
        if user.is_doctor_like:
            qs = qs.filter(doctor=user)
        elif user.role == 'rtms':
            qs = qs.filter(created_by=user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = MedicalRecordSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = MedicalRecordSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        record = MedicalRecord.objects.filter(id=pk, is_deleted=True).first()
        if not record:
            return Response({'error': 'پرونده یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        record.restore()
        return Response(MedicalRecordSerializer(record).data)

    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        record = MedicalRecord.objects.filter(id=pk, is_deleted=True).first()
        if not record:
            return Response({'error': 'پرونده یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        record.delete()
        return Response({'message': 'پرونده برای همیشه حذف شد'}, status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        patient = serializer.validated_data.get('patient')
        appointment = serializer.validated_data.get('appointment')
        if appointment:
            doctor = appointment.doctor
        else:
            doctor = self.request.user
        last = MedicalRecord.objects.filter(
            patient=patient, doctor=doctor
        ).order_by('-session_number').first()
        next_session = (last.session_number + 1) if last else 1
        record = serializer.save(doctor=doctor, session_number=next_session, created_by=self.request.user)

        if 'voice_data' in self.request.FILES:
            audio_file = self.request.FILES['voice_data']
            path = save_audio_file(audio_file.read(), audio_file.name)
            record.voice_note = path
            record.voice_transcription = transcribe_audio(path)
            record.save(update_fields=['voice_note', 'voice_transcription'])

        if record.patient.first_visit_date is None:
            from patients.models import Patient as PatientModel
            PatientModel.objects.filter(id=record.patient_id).update(first_visit_date=record.date)
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='MedicalRecord',
            object_id=record.id,
            details={'patient_id': record.patient_id, 'session': record.session_number}
        )

    def perform_update(self, serializer):
        record = serializer.save()

        if 'voice_data' in self.request.FILES:
            audio_file = self.request.FILES['voice_data']
            path = save_audio_file(audio_file.read(), audio_file.name)
            record.voice_note = path
            record.voice_transcription = transcribe_audio(path)
            record.save(update_fields=['voice_note', 'voice_transcription'])

        AuditLog.objects.create(
            user=self.request.user,
            action='update',
            model_name='MedicalRecord',
            object_id=record.id,
            details={'patient_id': record.patient_id, 'session': record.session_number}
        )

    @action(detail=False, methods=['post'])
    def restore_all(self, request):
        count = MedicalRecord.objects.filter(is_deleted=True).update(is_deleted=False, deleted_at=None, deleted_by=None)
        return Response({'restored': count, 'message': f'{count} پرونده درمانی بازیابی شدند'})

    @action(detail=False, methods=['delete'])
    def permanent_delete_all(self, request):
        qs = MedicalRecord.objects.filter(is_deleted=True)
        count = qs.count()
        qs.delete()
        return Response({'deleted': count, 'message': f'{count} پرونده درمانی برای همیشه حذف شدند'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def logs(self, request):
        logs = AuditLog.objects.select_related('user').all().order_by('-timestamp')[:100]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="medical_records.csv"'
        writer = csv.writer(response)
        writer.writerow(['بیمار', 'پزشک', 'شماره جلسه', 'تاریخ', 'تشخیص', 'طرح درمان', 'نسخه', 'یادداشت'])
        for r in self.get_queryset().iterator(chunk_size=200):
            writer.writerow([str(r.patient), r.doctor.get_full_name(), r.session_number, str(r.date), r.diagnosis, r.treatment_plan, r.prescription, r.notes])
        return response

    @action(detail=False, methods=['get'])
    def diagnosis_report(self, request):
        user = request.user
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        doctor_id = request.query_params.get('doctor')

        qs = MedicalRecord.objects.exclude(diagnosis='').select_related('patient')
        if user.is_doctor_like:
            qs = qs.filter(doctor=user)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if doctor_id and not user.is_doctor_like:
            qs = qs.filter(doctor_id=doctor_id)

        diagnoses = qs.values('diagnosis').annotate(count=Count('id')).order_by('-count')[:50]
        total = qs.count()

        records_with_patient = qs.values('id', 'diagnosis', 'patient_id', 'patient__first_name', 'patient__last_name').order_by('-date')[:200]

        return Response({
            'total_records': total,
            'total_with_diagnosis': diagnoses.count(),
            'diagnoses': diagnoses,
            'records': list(records_with_patient),
        })

    @action(detail=False, methods=['get'])
    def diagnosis_report_pdf(self, request):
        from utils.pdf_generator import ReportPDF

        user = request.user
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        doctor_id = request.query_params.get('doctor')

        qs = MedicalRecord.objects.exclude(diagnosis='').select_related('patient', 'doctor')
        if user.is_doctor_like:
            qs = qs.filter(doctor=user)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if doctor_id and not user.is_doctor_like:
            qs = qs.filter(doctor_id=doctor_id)

        diagnoses = qs.values('diagnosis').annotate(count=Count('id')).order_by('-count')[:20]
        total = qs.count()
        records_list = list(qs.values('diagnosis', 'patient__first_name', 'patient__last_name', 'date').order_by('-date')[:100])

        pdf = ReportPDF('گزارش تشخیص‌ها', 'گزارش جامع تشخیص‌های پزشکی')
        pdf.add_info_row('پزشک', user.get_full_name())
        pdf.add_info_row('کل پرونده‌ها', str(total))

        cards = [
            ('کل پرونده‌ها', total, '#2563eb'),
            ('تشخیص‌های ثبت‌شده', diagnoses.count(), '#10b981'),
        ]
        pdf.add_summary_cards(cards)

        diag_data = [d['count'] for d in diagnoses]
        diag_labels = [d['diagnosis'][:20] for d in diagnoses]
        if diag_data:
            pdf.add_bar_chart(diag_data, diag_labels, 'پراکندگی تشخیص‌ها')

        pdf.add_heading('جزئیات تشخیص‌ها')
        pdf.add_table(
            ['ردیف', 'تشخیص', 'تعداد'],
            [[i + 1, d['diagnosis'], d['count']] for i, d in enumerate(diagnoses)],
            [1.5 * cm, 10 * cm, 3 * cm]
        )

        pdf.add_heading('آخرین پرونده‌ها')
        pdf.add_table(
            ['ردیف', 'بیمار', 'تشخیص', 'تاریخ'],
            [[i + 1, f"{r['patient__first_name']} {r['patient__last_name']}",
              r['diagnosis'][:30], str(r['date'])] for i, r in enumerate(records_list[:50])],
            [1.2 * cm, 4 * cm, 6 * cm, 3 * cm]
        )

        pdf.add_doctor_signature(user.get_full_name())

        buf = pdf.build()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="diagnosis_report.pdf"'
        response.write(buf.read())
        return response

    @action(detail=True, methods=['post'])
    def upload_voice(self, request, pk=None):
        record = self.get_object()
        if 'file' not in request.FILES:
            return Response({'error': 'فایل صوتی ارسال نشده'}, status=status.HTTP_400_BAD_REQUEST)
        audio_file = request.FILES['file']
        path = save_audio_file(audio_file.read(), audio_file.name)
        record.voice_note = path
        record.voice_transcription = transcribe_audio(path)
        record.save(update_fields=['voice_note', 'voice_transcription'])
        return Response({
            'voice_note': record.voice_note.url if record.voice_note else None,
            'voice_transcription': record.voice_transcription,
        })

    @action(detail=False, methods=['get'])
    def patient_records(self, request):
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id required'}, status=400)
        records = self.get_queryset().filter(patient_id=patient_id)
        serializer = MedicalRecordSerializer(records, many=True)
        return Response(serializer.data)


class TmsFormViewSet(viewsets.ModelViewSet):
    queryset = TmsForm.objects.select_related('patient', 'doctor').filter(is_deleted=False).order_by('-date')
    serializer_class = TmsFormSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsDoctorOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = TmsForm.objects.select_related('patient', 'doctor').filter(is_deleted=False).order_by('-date')
        user = self.request.user
        if user.is_doctor_like:
            qs = qs.filter(doctor=user)
        elif user.role == 'rtms':
            qs = qs.filter(created_by=user)
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(doctor=self.request.user, created_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class VisitTemplateViewSet(viewsets.ModelViewSet):
    queryset = VisitTemplate.objects.all()
    serializer_class = VisitTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = VisitTemplate.objects.all()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        template = self.get_object()
        patient_id = request.data.get('patient_id')
        appointment_id = request.data.get('appointment_id')

        if not patient_id:
            return Response({'error': 'شناسه بیمار الزامی است'}, status=status.HTTP_400_BAD_REQUEST)

        from patients.models import Patient
        patient = Patient.objects.filter(id=patient_id).first()
        if not patient:
            return Response({'error': 'بیمار یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

        doctor = request.user
        if appointment_id:
            from appointments.models import Appointment
            appointment = Appointment.objects.filter(id=appointment_id).first()
            if appointment:
                doctor = appointment.doctor

        last = MedicalRecord.objects.filter(
            patient=patient, doctor=doctor
        ).order_by('-session_number').first()
        next_session = (last.session_number + 1) if last else 1

        record = MedicalRecord.objects.create(
            patient=patient,
            doctor=doctor,
            appointment_id=appointment_id,
            session_number=next_session,
            date=timezone.now().date(),
            diagnosis=template.diagnosis_template,
            treatment_plan=template.treatment_plan_template,
            notes=template.notes_template,
            prescription=template.prescription_template,
            created_by=request.user,
        )

        if patient.first_visit_date is None:
            Patient.objects.filter(id=patient.id).update(first_visit_date=record.date)

        from .serializers import MedicalRecordSerializer
        return Response(MedicalRecordSerializer(record).data, status=status.HTTP_201_CREATED)


class DicomFileViewSet(viewsets.ModelViewSet):
    queryset = DicomFile.objects.select_related('patient', 'uploaded_by').all()
    serializer_class = DicomFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['patient', 'medical_record', 'modality']

    def perform_create(self, serializer):
        dicom_file = self.request.FILES.get('file')
        metadata = {}
        thumbnail_path = None
        study_uid = ''
        series_uid = ''
        modality = ''
        if dicom_file:
            file_path = save_dicom_file(dicom_file.read(), dicom_file.name)
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            metadata = parse_dicom_metadata(full_path)
            thumbnail_path = generate_thumbnail(full_path)
            study_uid = metadata.get('study_uid', '')
            series_uid = metadata.get('series_uid', '')
            modality = metadata.get('modality', '')
            serializer.save(
                uploaded_by=self.request.user,
                file=file_path,
                thumbnail=thumbnail_path,
                metadata=metadata,
                study_uid=study_uid,
                series_uid=series_uid,
                modality=modality,
            )
        else:
            serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        instance = self.get_object()
        if instance.file:
            from django.http import FileResponse
            return FileResponse(instance.file, as_attachment=True, filename=os.path.basename(instance.file.name))
        return Response({'error': 'فایل یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def view_image(self, request, pk=None):
        instance = self.get_object()
        if instance.thumbnail:
            from django.http import FileResponse
            return FileResponse(instance.thumbnail, content_type='image/png')
        if instance.file:
            thumb = generate_thumbnail(os.path.join(settings.MEDIA_ROOT, instance.file.name))
            if thumb:
                from django.http import FileResponse
                return FileResponse(open(os.path.join(settings.MEDIA_ROOT, thumb), 'rb'), content_type='image/png')
        return Response({'error': 'تصویر یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
