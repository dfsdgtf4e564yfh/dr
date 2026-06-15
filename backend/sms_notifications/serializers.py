from rest_framework import serializers
from .models import SmsTemplate, SmsLog


class SmsTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmsTemplate
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class SmsLogSerializer(serializers.ModelSerializer):
    sent_by_username = serializers.SerializerMethodField()
    appointment_info = serializers.SerializerMethodField()
    created_at_jalali = serializers.SerializerMethodField()

    class Meta:
        model = SmsLog
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_sent_by_username(self, obj):
        if obj.sent_by:
            return obj.sent_by.get_full_name() or obj.sent_by.username
        return None

    def get_appointment_info(self, obj):
        if obj.appointment:
            return {
                'id': obj.appointment.id,
                'date': str(obj.appointment.date),
                'time': str(obj.appointment.time),
            }
        return None

    def get_created_at_jalali(self, obj):
        try:
            from utils.jalali import toJalali
            return toJalali(str(obj.created_at.date())) if obj.created_at else None
        except Exception:
            return str(obj.created_at) if obj.created_at else None
