import logging
import secrets
import base64
import io
from urllib.parse import quote
from django.core.cache import cache
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
import pyotp
from .models import TreatmentType, DoctorTreatment, ClinicSetting
from .serializers import (
    UserSerializer, UserCreateSerializer, TreatmentTypeSerializer,
    DoctorTreatmentSerializer, ChangePasswordSerializer, ClinicSettingSerializer,
    RoleSerializer
)
from .permission_defs import ALL_PAGES, DEFAULT_ROLE_PERMISSIONS
from .models import Role
from sms_notifications.utils import send_otp
from medical_records.models import AuditLog

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_config(request):
    try:
        obj, _ = ClinicSetting.objects.get_or_create(id=1)
        logo_url = None
        if obj.logo:
            logo_url = request.build_absolute_uri(obj.logo.url)
        return Response({
            'clinic_name': obj.clinic_name or 'کلینیک',
            'app_title': obj.clinic_name or 'کلینیک',
            'favicon': logo_url,
            'logo': logo_url,
            'debug': False,
            'version': '2.0.0',
        })
    except Exception:
        return Response({
            'clinic_name': 'کلینیک',
            'app_title': 'کلینیک',
            'debug': False,
            'version': '2.0.0',
        })


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class HasPermission(permissions.BasePermission):
    def __init__(self, *codenames):
        self.codenames = codenames
        super().__init__()

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        user_perms = set(request.user.page_permissions or [])
        return any(c in user_perms for c in self.codenames)


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]

    def _tokens(self, user):
        refresh = RefreshToken.for_user(user)
        return {'refresh': str(refresh), 'access': str(refresh.access_token)}

    def post(self, request, *args, **kwargs):
        username = request.data.get('username', '')
        password = request.data.get('password', '')
        otp_step = request.data.get('otp_step')

        if otp_step == 'verify':
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response({'detail': 'کاربر یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
            if not user.is_active:
                return Response({'detail': 'حساب کاربری غیرفعال است'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            user = authenticate(username=username, password=password)
            if user is None:
                return Response({'detail': 'نام کاربری یا رمز عبور اشتباه است'}, status=status.HTTP_401_UNAUTHORIZED)
            if not user.is_active:
                return Response({'detail': 'حساب کاربری غیرفعال است'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.totp_enabled:
            otp_step = request.data.get('otp_step')
            if otp_step == 'verify':
                code = request.data.get('code', '')
                totp = pyotp.TOTP(user.totp_secret)
                if totp.verify(code, valid_window=1):
                    AuditLog.objects.create(
                        user=user,
                        action='login',
                        model_name='User',
                        object_id=user.id,
                        details={'username': user.username, 'method': 'totp', 'ip': request.META.get('REMOTE_ADDR', '')}
                    )
                    return Response(self._tokens(user), status=status.HTTP_200_OK)
                return Response({'detail': 'کد تایید اشتباه است'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'requires_2fa': True,
                'method': 'totp',
                'message': 'کد Google Authenticator را وارد کنید',
            })

        if user.two_factor_enabled:
            otp_step = request.data.get('otp_step')
            if otp_step == 'verify':
                code = request.data.get('code', '')
                cached = cache.get(f'2fa_{user.phone}')
                if not cached:
                    return Response({'detail': 'کد تایید منقضی شده است'}, status=status.HTTP_400_BAD_REQUEST)
                if str(cached) != str(code):
                    return Response({'detail': 'کد تایید اشتباه است'}, status=status.HTTP_400_BAD_REQUEST)
                cache.delete(f'2fa_{user.phone}')
                AuditLog.objects.create(
                    user=user,
                    action='login',
                    model_name='User',
                    object_id=user.id,
                    details={'username': user.username, 'method': 'sms_2fa', 'ip': request.META.get('REMOTE_ADDR', '')}
                )
                return Response(self._tokens(user), status=status.HTTP_200_OK)
            else:
                ip = request.META.get('REMOTE_ADDR', '')
                result = send_otp(user.phone, user=user, ip_address=ip, purpose='ورود دو مرحله‌ای')
                if not result.get('success'):
                    return Response({'detail': result.get('error', 'خطا در ارسال کد تایید')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                code = result['code']
                cache.set(f'2fa_{user.phone}', code, timeout=180)
                return Response({
                    'requires_2fa': True,
                    'method': 'sms',
                    'phone': user.phone,
                    'message': 'کد تایید به شماره شما ارسال شد',
                })

        AuditLog.objects.create(
            user=user,
            action='login',
            model_name='User',
            object_id=user.id,
            details={'username': user.username, 'method': 'password', 'ip': request.META.get('REMOTE_ADDR', '')}
        )
        return Response(self._tokens(user), status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [HasPermission('roles_create')]
        if self.action == 'destroy':
            return [HasPermission('roles_delete')]
        if self.action in ['update', 'partial_update']:
            return [HasPermission('roles_edit')]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='User',
            object_id=user.id,
            details={'username': user.username, 'role': user.role, 'full_name': user.get_full_name()}
        )

    def perform_update(self, serializer):
        user = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='update',
            model_name='User',
            object_id=user.id,
            details={'username': user.username, 'role': user.role, 'full_name': user.get_full_name()}
        )

    def perform_destroy(self, instance):
        username = instance.username
        full_name = instance.get_full_name()
        instance.delete()
        AuditLog.objects.create(
            user=self.request.user,
            action='deleted',
            model_name='User',
            object_id=instance.id,
            details={'username': username, 'full_name': full_name}
        )

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.all().order_by('-date_joined')
        if user.role != 'admin':
            qs = qs.filter(id=user.id)
        return qs

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        user = request.user
        if request.method == 'PATCH':
            serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                if not user.profile_completed:
                    user.profile_completed = True
                    user.save(update_fields=['profile_completed'])
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def doctors(self, request):
        doctors = User.objects.filter(role__in=['doctor', 'psychologist', 'rtms'], is_active=True)
        if request.user.role == 'rtms' and request.user.restrictions:
            restricted_ids = request.user.restrictions.get('doctor_ids', [])
            if restricted_ids:
                doctors = doctors.filter(id__in=restricted_ids)
        serializer = UserSerializer(doctors, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def referral_recipients(self, request):
        recipients = User.objects.filter(is_active=True)
        serializer = UserSerializer(recipients, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], parser_classes=[MultiPartParser, FormParser])
    def upload_signature(self, request):
        file = request.FILES.get('signature')
        if not file:
            return Response({'signature': 'فایلی ارسال نشده'}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.signature:
            request.user.signature.delete(save=False)
        request.user.signature.save(file.name, file, save=True)
        request.user.refresh_from_db()
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def clear_signature(self, request):
        if request.user.signature:
            request.user.signature.delete()
        request.user.signature = None
        request.user.save()
        return Response({'message': 'امضا حذف شد'})

    @action(detail=False, methods=['patch'], parser_classes=[MultiPartParser, FormParser])
    def upload_avatar(self, request):
        file = request.FILES.get('avatar')
        if not file:
            return Response({'avatar': 'فایلی ارسال نشده'}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.avatar:
            request.user.avatar.delete(save=False)
        request.user.avatar.save(file.name, file, save=True)
        request.user.refresh_from_db()
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def clear_avatar(self, request):
        if request.user.avatar:
            request.user.avatar.delete()
        request.user.avatar = None
        request.user.save()
        return Response({'message': 'تصویر پروفایل حذف شد'})

    @action(detail=False, methods=['get'])
    def available_permissions(self, request):
        return Response(ALL_PAGES)

    @action(detail=False, methods=['get', 'post'])
    def totp_setup(self, request):
        user = request.user
        if request.method == 'POST':
            if user.totp_enabled:
                return Response({'message': 'Google Authenticator قبلاً فعال شده است.'})
            if not user.totp_secret:
                user.totp_secret = pyotp.random_base32()
                user.save(update_fields=['totp_secret'])
            secret = user.totp_secret
            issuer = 'کلینیک'
            provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                name=user.username, issuer_name=issuer
            )
            import qrcode
            qr = qrcode.make(provisioning_uri)
            buf = io.BytesIO()
            qr.save(buf, format='PNG')
            qr_b64 = base64.b64encode(buf.getvalue()).decode()
            return Response({
                'secret': secret,
                'provisioning_uri': provisioning_uri,
                'qr_code': f'data:image/png;base64,{qr_b64}',
            })
        if user.totp_enabled:
            return Response({'enabled': True, 'message': 'Google Authenticator فعال است.'})
        if not user.totp_secret:
            user.totp_secret = pyotp.random_base32()
            user.save(update_fields=['totp_secret'])
        secret = user.totp_secret
        issuer = 'کلینیک'
        provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.username, issuer_name=issuer
        )
        return Response({
            'enabled': False,
            'secret': secret,
            'provisioning_uri': provisioning_uri,
        })

    @action(detail=False, methods=['post'])
    def totp_verify(self, request):
        user = request.user
        code = request.data.get('code', '')
        if not code:
            return Response({'error': 'کد تایید را وارد کنید'}, status=status.HTTP_400_BAD_REQUEST)
        secret = user.totp_secret
        if not secret:
            return Response({'error': 'ابتدا Google Authenticator را راه‌اندازی کنید'}, status=status.HTTP_400_BAD_REQUEST)
        totp = pyotp.TOTP(secret)
        if totp.verify(code, valid_window=1):
            user.totp_enabled = True
            user.two_factor_enabled = True
            user.save(update_fields=['totp_enabled', 'two_factor_enabled'])
            return Response({'message': 'Google Authenticator با موفقیت فعال شد.'})
        return Response({'error': 'کد نامعتبر است. دوباره تلاش کنید.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def totp_disable(self, request):
        user = request.user
        if not user.totp_enabled:
            return Response({'error': 'Google Authenticator فعال نیست.'}, status=status.HTTP_400_BAD_REQUEST)

        current_password = request.data.get('password', '')
        if not current_password or not user.check_password(current_password):
            return Response({'error': 'برای غیرفعال کردن، رمز عبور خود را وارد کنید'}, status=status.HTTP_400_BAD_REQUEST)

        user.totp_enabled = False
        user.totp_secret = ''
        user.save(update_fields=['totp_enabled', 'totp_secret'])
        AuditLog.objects.create(
            user=user,
            action='totp_disabled',
            model_name='User',
            object_id=user.id,
            details={'username': user.username}
        )
        return Response({'message': 'Google Authenticator غیرفعال شد.'})

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            if not request.user.check_password(serializer.validated_data['old_password']):
                return Response({'error': 'رمز فعلی اشتباه است'}, status=status.HTTP_400_BAD_REQUEST)
            new_pass = serializer.validated_data['new_password']
            if request.user.check_password(new_pass):
                return Response({'error': 'رمز جدید نباید با رمز فعلی یکسان باشد'}, status=status.HTTP_400_BAD_REQUEST)
            request.user.set_password(new_pass)
            request.user.save()
            return Response({'message': 'رمز عبور با موفقیت تغییر کرد'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def set_restrictions(self, request, pk=None):
        user = self.get_object()
        restrictions = request.data.get('restrictions', {})
        if not isinstance(restrictions, dict):
            return Response({'error': 'restrictions must be a dict'}, status=status.HTTP_400_BAD_REQUEST)
        user.restrictions = restrictions
        user.save(update_fields=['restrictions'])
        return Response(UserSerializer(user, context={'request': request}).data)


class TreatmentTypeViewSet(viewsets.ModelViewSet):
    queryset = TreatmentType.objects.all()
    serializer_class = TreatmentTypeSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [HasPermission('treatment_types_create')]
        if self.action == 'destroy':
            return [HasPermission('treatment_types_delete')]
        if self.action in ['update', 'partial_update']:
            return [HasPermission('treatment_types_edit')]
        return super().get_permissions()

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        if request.user.role == 'rtms' and request.user.restrictions:
            restricted_ids = request.user.restrictions.get('treatment_ids', [])
            if restricted_ids:
                qs = qs.filter(id__in=restricted_ids)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class ClinicSettingViewSet(viewsets.mixins.RetrieveModelMixin,
                           viewsets.mixins.UpdateModelMixin,
                           viewsets.GenericViewSet):
    queryset = ClinicSetting.objects.all()
    serializer_class = ClinicSettingSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = None

    def get_object(self):
        obj, _ = ClinicSetting.objects.get_or_create(id=1)
        return obj

    def perform_update(self, serializer):
        clinic = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='update',
            model_name='ClinicSetting',
            object_id=clinic.id,
            details={'clinic_name': clinic.clinic_name}
        )

    def list(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [HasPermission('roles_create')]
        if self.action == 'destroy':
            return [HasPermission('roles_delete')]
        if self.action in ['update', 'partial_update']:
            return [HasPermission('roles_edit')]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def all_permissions(self, request):
        return Response(ALL_PAGES)

    @action(detail=False, methods=['get'])
    def default_permissions(self, request):
        return Response(DEFAULT_ROLE_PERMISSIONS)


class DoctorTreatmentViewSet(viewsets.ModelViewSet):
    queryset = DoctorTreatment.objects.select_related('doctor', 'treatment_type').all()
    serializer_class = DoctorTreatmentSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [HasPermission('doctor_treatments_create')]
        if self.action == 'destroy':
            return [HasPermission('doctor_treatments_delete')]
        if self.action in ['update', 'partial_update']:
            return [HasPermission('doctor_treatments_edit')]
        return super().get_permissions()

    def get_queryset(self):
        qs = DoctorTreatment.objects.select_related('doctor', 'treatment_type').all()
        user = self.request.user
        if user.role in ('doctor', 'psychologist', 'rtms'):
            qs = qs.filter(doctor=user)
        return qs


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password_send_otp(request):
    phone = request.data.get('phone', '')
    if not phone:
        return Response({'error': 'شماره موبایل وارد نشده'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(phone=phone, is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'کاربری با این شماره یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    ip = request.META.get('REMOTE_ADDR', '')
    result = send_otp(phone, user=user, ip_address=ip, purpose='فراموشی رمز')
    if not result.get('success'):
        return Response({'error': result.get('error', 'خطا در ارسال کد تایید')}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    code = result['code']
    cache.set(f'otp_{phone}', code, timeout=180)
    return Response({'message': 'کد تایید ارسال شد', 'phone': phone})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password_verify_otp(request):
    phone = request.data.get('phone', '')
    code = request.data.get('code', '')
    if not phone or not code:
        return Response({'error': 'شماره موبایل و کد تایید وارد نشده'}, status=status.HTTP_400_BAD_REQUEST)

    cached = cache.get(f'otp_{phone}')
    if not cached:
        return Response({'error': 'کد تایید منقضی شده است. لطفاً دوباره درخواست دهید'}, status=status.HTTP_400_BAD_REQUEST)
    if str(cached) != str(code):
        return Response({'error': 'کد تایید اشتباه است'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(phone=phone, is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'کاربر یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    cache.delete(f'otp_{phone}')
    token = cache.get_or_set(f'reset_token_{phone}', secrets.token_hex(32), timeout=600)
    return Response({
        'message': 'کد تایید صحیح است',
        'reset_token': token,
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password_reset(request):
    phone = request.data.get('phone', '')
    token = request.data.get('reset_token', '')
    new_password = request.data.get('new_password', '')
    if not phone or not token or not new_password:
        return Response({'error': 'تمام فیلدها را پر کنید'}, status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < 8:
        return Response({'error': 'رمز عبور باید حداقل ۸ کاراکتر باشد'}, status=status.HTTP_400_BAD_REQUEST)

    cached = cache.get(f'reset_token_{phone}')
    if not cached or str(cached) != str(token):
        return Response({'error': 'توکن نامعتبر است. لطفاً دوباره درخواست دهید'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(phone=phone, is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'کاربر یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

    user.set_password(new_password)
    user.save()
    cache.delete(f'reset_token_{phone}')
    return Response({'message': 'رمز عبور با موفقیت تغییر کرد'})
