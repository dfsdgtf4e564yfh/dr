import os
import secrets
from pathlib import Path
from datetime import timedelta
import base64
import hashlib

from dotenv import load_dotenv
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'django-insecure-ckz5$7a^#@!'
    else:
        SECRET_KEY = secrets.token_urlsafe(32)

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'cachalot',
    'accounts',
    'patients',
    'appointments',
    'medical_records',
    'billing',
    'dashboard',
    'sms_notifications',
    'backup',
    'channels',
    'health_check',
    'patient_identity',
    'online_booking',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'config.middleware.UploadSizeErrorMiddleware',
    'config.middleware.PermissionMiddleware',
    'config.middleware.CorsCSRFMiddleware',
    'config.middleware.RequestLoggingMiddleware',
    'config.middleware.RateLimitMiddleware',
    'config.middleware.SecurityHeadersMiddleware',
    'config.middleware.AccountLockoutMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR.parent, 'frontend', 'dist')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ASGI_APPLICATION = 'config.asgi.application'
WSGI_APPLICATION = 'config.wsgi.application'

SQLITE_DIR = BASE_DIR / 'data'
SQLITE_DIR.mkdir(exist_ok=True)

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': SQLITE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'timeout': 20,
        },
    }
}

if os.environ.get('USE_POSTGRES', 'False').lower() == 'true':
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'clinic_db'),
        'USER': os.environ.get('DB_USER', 'clinic_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'clinic_password'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'CONN_MAX_AGE': int(os.environ.get('DB_CONN_MAX_AGE', '300')),
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer' if os.environ.get('REDIS_URL') else 'channels.layers.InMemoryChannelLayer',
        'CONFIG': {
            'hosts': [os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/0')],
        } if os.environ.get('REDIS_URL') else {},
    },
}

TIME_ZONE = 'Asia/Tehran'
USE_TZ = True

AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
    'DATE_FORMAT': '%Y-%m-%d',
    'EXCEPTION_HANDLER': 'utils.exceptions.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '1000/hour',
        'user': '10000/hour',
    },
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'کلینیک مدیریت API',
    'DESCRIPTION': 'سیستم مدیریت مطب/کلینیک با مستندات خودکار',
    'VERSION': '2.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SERVE_PERMISSIONS': ['rest_framework.permissions.IsAdminUser'],
    'COMPONENT_SPLIT_REQUEST': True,
    'SWAGGER_UI_SETTINGS': {
        'persistAuthorization': True,
        'displayRequestDuration': True,
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'False').lower() == 'true'
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:5173'
).split(',')

CORS_ALLOW_CREDENTIALS = os.environ.get('CORS_ALLOW_CREDENTIALS', 'True').lower() == 'true'

CSRF_TRUSTED_ORIGINS = [
    o for o in os.environ.get(
        'CSRF_TRUSTED_ORIGINS',
        'http://localhost:3000,http://localhost:5173'
    ).split(',') if o
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False').lower() == 'true'
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

_frontend_assets = os.path.join(BASE_DIR.parent, 'frontend', 'dist', 'assets')
STATICFILES_DIRS = [_frontend_assets] if os.path.isdir(_frontend_assets) else []

FRONTEND_DIST_DIR = os.path.join(BASE_DIR.parent, 'frontend', 'dist')

DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get('DATA_UPLOAD_MAX_MEMORY_SIZE', 150 * 1024 * 1024))
FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get('FILE_UPLOAD_MAX_MEMORY_SIZE', 150 * 1024 * 1024))
DATA_UPLOAD_MAX_NUMBER_FIELDS = int(os.environ.get('DATA_UPLOAD_MAX_NUMBER_FIELDS', 1000))
DATA_UPLOAD_MAX_NUMBER_FILES = int(os.environ.get('DATA_UPLOAD_MAX_NUMBER_FILES', 100))

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = hashlib.sha256(SECRET_KEY.encode()).hexdigest()
    import logging
    logging.warning('ENCRYPTION_KEY not set; derived from SECRET_KEY. '
                    'Set ENCRYPTION_KEY explicitly for safety.')

ZARINPAL_MERCHANT_ID = os.environ.get('ZARINPAL_MERCHANT_ID', '')
ZARINPAL_SANDBOX = os.environ.get('ZARINPAL_SANDBOX', 'True').lower() == 'true'
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID', '')
GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET', '')

SMS_PROVIDER = os.environ.get('SMS_PROVIDER', 'melipayamak')
SMS_API_KEY = os.environ.get('SMS_API_KEY', '')
SMS_API_BASE = os.environ.get('SMS_API_BASE', 'https://console.melipayamak.com/api')
SMS_LINE_NUMBER = os.environ.get('SMS_LINE_NUMBER', '')

EITAA_BOT_TOKEN = os.environ.get('EITAA_BOT_TOKEN', '')
BALE_BOT_TOKEN = os.environ.get('BALE_BOT_TOKEN', '')
RUBIKA_TOKEN = os.environ.get('RUBIKA_TOKEN', '')

BACKUP_DIR = os.environ.get('BACKUP_DIR', os.path.join(BASE_DIR, 'backups'))
os.makedirs(BACKUP_DIR, exist_ok=True)

# Google Drive OAuth settings
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/backup/cloud/callback/')

if os.environ.get('REDIS_URL'):
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.environ['REDIS_URL'],
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'CONNECTION_POOL_CLASS': 'redis.connection.BlockingConnectionPool',
                'CONNECTION_POOL_CLASS_KWARGS': {
                    'max_connections': 50,
                    'timeout': 20,
                },
                'PARSER_CLASS': 'redis.connection.HiredisParser',
                'SOCKET_CONNECT_TIMEOUT': 5,
                'SOCKET_TIMEOUT': 5,
                'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            },
            'KEY_PREFIX': 'clinic',
        }
    }

ALERT_EMAIL_RECIPIENTS = os.environ.get('ALERT_EMAIL_RECIPIENTS', '').split(',')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@clinic.local')

SENTRY_DSN = os.environ.get('SENTRY_DSN', '')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), RedisIntegration()],
        traces_sample_rate=float(os.environ.get('SENTRY_TRACES_SAMPLE_RATE', '0.5')),
        send_default_pii=False,
        environment='production' if not DEBUG else 'development',
    )

# Logging
from utils.logging_config import setup_logging
setup_logging(debug=DEBUG)
