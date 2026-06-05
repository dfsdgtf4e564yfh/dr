from rest_framework import serializers
from .models import Billing, Settlement


class BillingSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Billing
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name',
                  'appointment', 'cost_type', 'total_amount', 'paid_amount', 'payment_method',
                  'receipt_number', 'doctor_commission_percentage', 'doctor_share', 'status',
                  'description', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'doctor_share', 'created_by', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name()

    def validate(self, data):
        if data.get('paid_amount', 0) > data.get('total_amount', 0):
            raise serializers.ValidationError('مبلغ پرداختی نمی‌تواند بیشتر از مبلغ کل باشد')
        return data


class BillingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Billing
        fields = ['id', 'patient', 'doctor', 'appointment', 'cost_type', 'total_amount',
                  'paid_amount', 'payment_method', 'receipt_number', 'doctor_commission_percentage',
                  'status', 'description']
        read_only_fields = ['id']

    def validate(self, data):
        if data.get('paid_amount', 0) > data.get('total_amount', 0):
            raise serializers.ValidationError('مبلغ پرداختی نمی‌تواند بیشتر از مبلغ کل باشد')
        return data

    def create(self, validated_data):
        doctor = validated_data.get('doctor')
        if doctor and not validated_data.get('doctor_commission_percentage'):
            validated_data['doctor_commission_percentage'] = doctor.commission_percentage or 0
        return super().create(validated_data)


class SettlementSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Settlement
        fields = ['id', 'doctor', 'doctor_name', 'amount', 'date', 'status', 'notes', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name()


class SettlementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settlement
        fields = ['doctor', 'amount', 'status', 'notes']


class FinancialReportSerializer(serializers.Serializer):
    total_income = serializers.DecimalField(max_digits=15, decimal_places=0)
    total_paid = serializers.DecimalField(max_digits=15, decimal_places=0)
    total_pending = serializers.DecimalField(max_digits=15, decimal_places=0)
    doctor_incomes = serializers.ListField(child=serializers.DictField())
