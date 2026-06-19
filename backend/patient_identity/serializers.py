from rest_framework import serializers
from .models import PatientIdentity


class PatientIdentitySerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = PatientIdentity
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'verified_at', 'verified_by', 'fingerprint_hash']

    def get_patient_name(self, obj):
        return str(obj.patient) if obj.patient else ''


class PatientIdentityVerifySerializer(serializers.Serializer):
    verified = serializers.BooleanField()
    notes = serializers.CharField(required=False, allow_blank=True)
