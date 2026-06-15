from rest_framework import serializers
from .models import User, TreatmentType, DoctorTreatment, ClinicSetting, Role
from .permission_defs import DEFAULT_ROLE_PERMISSIONS


class RoleSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'is_system_role', 'is_active', 'created_at', 'updated_at', 'user_count']
        read_only_fields = ['id', 'is_system_role', 'created_at', 'updated_at', 'user_count']

    def get_user_count(self, obj):
        from .models import User
        return User.objects.filter(role=obj.name).count()


class TreatmentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentType
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    totp_secret = serializers.CharField(read_only=True)
    role = serializers.CharField()
    avatar = serializers.SerializerMethodField()
    signature = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'full_name', 'email',
                  'phone', 'role', 'commission_percentage', 'signature', 'avatar',
                  'specialization', 'medical_council_number', 'is_active',
                  'page_permissions', 'two_factor_enabled', 'profile_completed',
                  'totp_secret', 'totp_enabled']
        read_only_fields = ['id']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    def get_signature(self, obj):
        if obj.signature:
            return obj.signature.url
        return None

    def validate(self, attrs):
        if attrs.get('two_factor_enabled'):
            phone = attrs.get('phone') or (self.instance.phone if self.instance else '')
            if not phone:
                raise serializers.ValidationError({'two_factor_enabled': 'برای فعالسازی تایید دو مرحله‌ای ابتدا شماره موبایل را وارد کنید'})
        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField()

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'email',
                  'phone', 'role', 'commission_percentage', 'signature',
                  'specialization', 'medical_council_number', 'is_active',
                  'page_permissions', 'two_factor_enabled', 'profile_completed']

    def create(self, validated_data):
        password = validated_data.pop('password')
        if not validated_data.get('page_permissions'):
            role_name = validated_data.get('role', 'reception')
            role = Role.objects.filter(name=role_name, is_active=True).first()
            if role and role.permissions:
                validated_data['page_permissions'] = role.permissions
            else:
                validated_data['page_permissions'] = DEFAULT_ROLE_PERMISSIONS.get(role_name, [])
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class DoctorTreatmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    treatment_name = serializers.SerializerMethodField()

    class Meta:
        model = DoctorTreatment
        fields = ['id', 'doctor', 'doctor_name', 'treatment_type', 'treatment_name']

    def get_doctor_name(self, obj):
        return obj.doctor.get_full_name()

    def get_treatment_name(self, obj):
        return obj.treatment_type.name


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)


class ClinicSettingSerializer(serializers.ModelSerializer):
    sms_api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    sms_username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    sms_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    sms_api_key_display = serializers.SerializerMethodField()
    sms_username_display = serializers.SerializerMethodField()
    logo = serializers.SerializerMethodField()

    class Meta:
        model = ClinicSetting
        fields = ['id', 'clinic_name', 'logo', 'address', 'phone', 'phone2', 'phone3',
                  'sms_api_key', 'sms_api_key_display', 'sms_api_base',
                  'sms_username', 'sms_username_display', 'sms_password',
                  'sms_line_number', 'sms_provider']
        read_only_fields = ['id']

    def get_sms_api_key_display(self, obj):
        val = obj.sms_api_key
        return f"{val[:4]}..." if len(val) > 8 else ''

    def get_sms_username_display(self, obj):
        val = obj.sms_username
        return f"{val[:4]}..." if len(val) > 4 else ''

    def get_logo(self, obj):
        if obj.logo:
            return obj.logo.url
        return None

    def update(self, instance, validated_data):
        if 'sms_api_key' in validated_data:
            instance.sms_api_key = validated_data.pop('sms_api_key')
        if 'sms_username' in validated_data:
            instance.sms_username = validated_data.pop('sms_username')
        if 'sms_password' in validated_data:
            instance.sms_password = validated_data.pop('sms_password')
        return super().update(instance, validated_data)
