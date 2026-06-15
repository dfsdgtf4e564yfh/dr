from rest_framework import serializers
from .models import Holiday, ClinicConfig
from accounts.models import TreatmentType
from patients.models import Patient


class TreatmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentType
        fields = ['id', 'name', 'description', 'price']


class PatientLookupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'national_id', 'phone', 'gender', 'birth_date', 'file_number']


class PatientRegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    national_id = serializers.CharField(max_length=10, min_length=10)
    phone = serializers.CharField(max_length=20)
    gender = serializers.ChoiceField(choices=['male', 'female'], required=False)
    birth_date = serializers.DateField(required=False)

    def validate_national_id(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('کد ملی باید ۱۰ رقم باشد')
        return value


class BookingRequestSerializer(serializers.Serializer):
    national_id = serializers.CharField(max_length=10, min_length=10)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=20)
    gender = serializers.CharField(required=False, allow_blank=True)
    birth_date = serializers.DateField(required=False, allow_null=True)
    service_id = serializers.IntegerField()
    date = serializers.DateField()
    time = serializers.TimeField()
    payment_method = serializers.ChoiceField(choices=['in_person', 'online'])


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'


class ClinicConfigSerializer(serializers.Serializer):
    key = serializers.CharField()
    value = serializers.CharField(allow_blank=True)
