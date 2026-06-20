import re
from rest_framework import serializers
from .models import Patient, ReferralLetter, SupportMessage, PatientTag, PatientTagAssignment
from utils.encryption import hash_value



class PatientListSerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()
    created_by_role = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = ['id', 'file_number', 'first_name', 'last_name', 'gender', 'father_name', 'national_id',
                  'insurance_booklet', 'phone', 'emergency_phone', 'birth_date',
                  'first_visit_date', 'routine_medications', 'address',
                  'medical_history', 'created_at', 'created_by', 'created_by_role', 'education', 'job', 'old_file_number',
                  'tags', 'visible_to_rtms']
        read_only_fields = ['id', 'created_at', 'created_by', 'first_visit_date']

    def get_tags(self, obj):
        assignments = PatientTagAssignment.objects.filter(patient=obj).select_related('tag')
        return [{'id': a.tag.id, 'name': a.tag.name, 'color': a.tag.color} for a in assignments]

    def get_created_by_role(self, obj):
        return obj.created_by.role if obj.created_by else None


class PatientDetailSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    national_id = serializers.CharField()
    phone = serializers.CharField()
    emergency_phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    medical_history = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Patient
        fields = ['id', 'file_number', 'old_file_number',
                  'first_name', 'last_name', 'gender', 'father_name',
                  'national_id', 'phone', 'emergency_phone',
                  'birth_date', 'first_visit_date',
                  'education', 'job', 'insurance_booklet',
                  'address', 'medical_history', 'routine_medications',
                  'created_at', 'updated_at', 'created_by',
                  'is_deleted', 'deleted_at', 'deleted_by',
                  'age', 'tags', 'visible_to_rtms']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'first_visit_date', 'is_deleted', 'deleted_at', 'deleted_by']
        extra_kwargs = {
            'national_id_raw': {'write_only': True},
            'national_id_enc': {'write_only': True},
            'national_id_hash': {'write_only': True},
            'phone_raw': {'write_only': True},
            'phone_enc': {'write_only': True},
            'phone_hash': {'write_only': True},
            'emergency_phone_raw': {'write_only': True},
            'emergency_phone_enc': {'write_only': True},
            'address_raw': {'write_only': True},
            'address_enc': {'write_only': True},
            'medical_history_raw': {'write_only': True},
            'medical_history_enc': {'write_only': True},
        }

    def get_tags(self, obj):
        assignments = PatientTagAssignment.objects.filter(patient=obj).select_related('tag')
        return [{'id': a.tag.id, 'name': a.tag.name, 'color': a.tag.color} for a in assignments]

    def get_age(self, obj):
        return obj.age()

    def validate_first_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('نام نمی‌تواند خالی باشد')
        if len(value.strip()) < 2:
            raise serializers.ValidationError('نام باید حداقل 2 حرف باشد')
        if not re.match(r'^[\u0600-\u06FF\s]+$', value.strip()):
            raise serializers.ValidationError('نام باید فقط با حروف فارسی وارد شود')
        return value.strip()

    def validate_last_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('نام خانوادگی نمی‌تواند خالی باشد')
        if len(value.strip()) < 2:
            raise serializers.ValidationError('نام خانوادگی باید حداقل 2 حرف باشد')
        if not re.match(r'^[\u0600-\u06FF\s]+$', value.strip()):
            raise serializers.ValidationError('نام خانوادگی باید فقط با حروف فارسی وارد شود')
        return value.strip()

    def validate_father_name(self, value):
        if value and not re.match(r'^[\u0600-\u06FF\s]+$', value.strip()):
            raise serializers.ValidationError('نام پدر باید فقط با حروف فارسی وارد شود')
        return value

    def validate_national_id(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('کد ملی نمی‌تواند خالی باشد')
        value = value.strip()
        if not re.match(r'^\d{10}$', value):
            raise serializers.ValidationError('کد ملی باید 10 رقم باشد')
nhash = hash_value(value)
        if Patient.objects.filter(national_id_hash=nhash).exclude(
                id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError('این کد ملی قبلاً برای بیمار دیگری ثبت شده است')
        return value

    def validate_phone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('شماره تماس نمی‌تواند خالی باشد')
        value = value.strip()
        if not re.match(r'^09\d{9}$', value):
            raise serializers.ValidationError('شماره تماس باید 11 رقم و با 09 شروع شود')
        return value

    def validate_emergency_phone(self, value):
        if value and not re.match(r'^09\d{9}$', value.strip()):
            raise serializers.ValidationError('شماره اضطراری باید 11 رقم و با 09 شروع شود')
        return value

    def validate_file_number(self, value):
        if value:
            from django.db.models import Q
            dup = Patient.objects.filter(
                Q(file_number=value) & ~Q(id=self.instance.id if self.instance else None)
            )
            if dup.exists():
                raise serializers.ValidationError('این شماره پرونده قبلاً ثبت شده است')
        return value


class ReferralLetterSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_gender = serializers.SerializerMethodField()
    patient_national_id = serializers.SerializerMethodField()
    patient_phone = serializers.SerializerMethodField()
    patient_address = serializers.SerializerMethodField()
    patient_file_number = serializers.SerializerMethodField()
    patient_routine_medications = serializers.SerializerMethodField()
    patient_first_visit_date = serializers.SerializerMethodField()
    from_doctor_name = serializers.SerializerMethodField()
    from_doctor_specialization = serializers.SerializerMethodField()
    from_doctor_council_number = serializers.SerializerMethodField()
    from_doctor_signature = serializers.SerializerMethodField()
    to_user_name = serializers.SerializerMethodField()
    date = serializers.DateField(required=False)

    class Meta:
        model = ReferralLetter
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'date']

    def get_patient_name(self, obj):
        return str(obj.patient)

    def get_patient_gender(self, obj):
        return obj.patient.gender if obj.patient else 'male'

    def get_patient_national_id(self, obj):
        return obj.patient.national_id if obj.patient else ''

    def get_patient_phone(self, obj):
        return obj.patient.phone if obj.patient else ''

    def get_patient_address(self, obj):
        return obj.patient.address if obj.patient else ''

    def get_patient_file_number(self, obj):
        return obj.patient.file_number if obj.patient and obj.patient.file_number else ''

    def get_patient_routine_medications(self, obj):
        return obj.patient.routine_medications if obj.patient else ''

    def get_patient_first_visit_date(self, obj):
        return obj.patient.first_visit_date if obj.patient else None

    def get_from_doctor_name(self, obj):
        return obj.from_doctor.get_full_name() if obj.from_doctor else ''

    def get_from_doctor_specialization(self, obj):
        return obj.from_doctor.specialization if obj.from_doctor else ''

    def get_from_doctor_council_number(self, obj):
        return obj.from_doctor.medical_council_number if obj.from_doctor else ''

    def get_from_doctor_signature(self, obj):
        if obj.from_doctor and obj.from_doctor.signature:
            request = self.context.get('request')
            url = obj.from_doctor.signature.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return ''

    def get_to_user_name(self, obj):
        if obj.to_user:
            return obj.to_user.get_full_name()
        return ''


class PatientTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientTag
        fields = ['id', 'name', 'color', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class PatientTagAssignmentSerializer(serializers.ModelSerializer):
    tag_name = serializers.SerializerMethodField()
    tag_color = serializers.SerializerMethodField()

    class Meta:
        model = PatientTagAssignment
        fields = ['id', 'patient', 'tag', 'tag_name', 'tag_color', 'created_at']
        read_only_fields = ['id', 'created_at', 'created_by']

    def get_tag_name(self, obj):
        return obj.tag.name if obj.tag else ''

    def get_tag_color(self, obj):
        return obj.tag.color if obj.tag else '#3B82F6'


class SupportMessageSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(), required=False, allow_null=True
    )
    patient_name = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportMessage
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'replied_at', 'sender']

    def get_patient_name(self, obj):
        return str(obj.patient) if obj.patient else ''

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() if obj.sender else ''

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            url = obj.attachment.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_attachment_name(self, obj):
        if obj.attachment:
            return obj.attachment.name.split('/')[-1]
        return None
