from rest_framework import serializers
from .models import MedicalRecord, MedicalRecordFile, AuditLog, CommonDiagnosis, CommonDrug, CommonTreatmentPlan, TmsForm, VisitTemplate, DicomFile


class MedicalRecordFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecordFile
        fields = ['id', 'file', 'description', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class MedicalRecordSerializer(serializers.ModelSerializer):
    files = MedicalRecordFileSerializer(many=True, read_only=True)
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    patient_national_id = serializers.SerializerMethodField()
    patient_file_number = serializers.SerializerMethodField()
    uploaded_files = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)

    class Meta:
        model = MedicalRecord
        fields = ['id', 'patient', 'patient_name', 'patient_national_id', 'patient_file_number',
                  'doctor', 'doctor_name', 'appointment', 'session_number', 'date', 'diagnosis',
                  'treatment_plan', 'notes', 'prescription', 'voice_note', 'voice_transcription',
                  'files', 'uploaded_files', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name()

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def get_patient_national_id(self, obj):
        return obj.patient.national_id

    def get_patient_file_number(self, obj):
        return obj.patient.file_number

    def create(self, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        record = MedicalRecord.objects.create(**validated_data)
        for f in uploaded_files:
            MedicalRecordFile.objects.create(medical_record=record, file=f)
        return record

    def update(self, instance, validated_data):
        uploaded_files = validated_data.pop('uploaded_files', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        for f in uploaded_files:
            MedicalRecordFile.objects.create(medical_record=instance, file=f)
        return instance


class CommonDiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommonDiagnosis
        fields = '__all__'


class CommonDrugSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommonDrug
        fields = '__all__'


class CommonTreatmentPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommonTreatmentPlan
        fields = '__all__'


class TmsFormSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    patient_info = serializers.SerializerMethodField()

    class Meta:
        model = TmsForm
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'doctor']

    def get_patient_name(self, obj):
        return str(obj.patient)

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name()

    def get_patient_info(self, obj):
        p = obj.patient
        return {
            'first_name': p.first_name,
            'last_name': p.last_name,
            'father_name': p.father_name or '',
            'national_id': p.national_id,
            'file_number': p.file_number or '',
            'age': p.age(),
            'education': p.education or '',
            'job': p.job or '',
            'phone': p.phone,
            'address': p.address or '',
        }


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_name', 'action', 'model_name',
                  'object_id', 'details', 'ip_address', 'timestamp']
        read_only_fields = '__all__'

    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else 'سیستم'


class VisitTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = VisitTemplate
        fields = ['id', 'title', 'category', 'diagnosis_template', 'treatment_plan_template',
                  'notes_template', 'prescription_template', 'is_active',
                  'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name()


class DicomFileSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DicomFile
        fields = ['id', 'patient', 'patient_name', 'medical_record', 'file', 'thumbnail',
                  'metadata', 'study_uid', 'series_uid', 'modality', 'description',
                  'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'thumbnail', 'metadata', 'created_at', 'uploaded_by', 'uploaded_by_name']

    def get_patient_name(self, obj):
        return str(obj.patient)

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else ''
