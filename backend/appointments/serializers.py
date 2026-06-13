from rest_framework import serializers
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    treatment_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name',
                  'treatment_type', 'treatment_name', 'date', 'time', 'cost', 'service_cost', 'status',
                  'notes', 'sms_sent', 'source', 'external_id', 'daily_number', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'sms_sent', 'created_by', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name()

    def get_treatment_name(self, obj):
        return obj.treatment_type.name


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'doctor', 'treatment_type', 'date', 'time', 'cost', 'service_cost', 'status', 'notes', 'source', 'external_id', 'daily_number']
        read_only_fields = ['id', 'daily_number']

    def validate(self, data):
        from .models import Appointment
        qs = Appointment.objects.filter(
            doctor=data['doctor'],
            date=data['date'],
            time=data['time'],
            status__in=['scheduled', 'rescheduled'],
            is_deleted=False,
        )
        # Exclude current instance on update
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('این زمان قبلاً رزرو شده است')
        return data


class AppointmentCalendarSerializer(serializers.Serializer):
    date = serializers.DateField()
    appointments = serializers.ListField(child=serializers.DictField())
