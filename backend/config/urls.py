import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from django.http import HttpResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
try:
    from health_check.views import MainView as HealthCheckView
except ImportError:
    from health_check.views import HealthCheckView
from accounts.views import public_config
from config.views import serve_media

def serve_frontend(request, path=''):
    index_path = os.path.join(settings.FRONTEND_DIST_DIR, 'index.html')
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            html = f.read()
    except FileNotFoundError:
        return HttpResponse(
            '<h1>در حال راه‌اندازی...</h1><p>لطفاً چند لحظه صبر کنید و صفحه را رفرش کنید.</p>',
            content_type='text/html; charset=utf-8',
            status=503
        )
    api_url = f"{request.scheme}://{request.get_host()}/api"
    debug = 'true' if settings.DEBUG else 'false'
    config = f'<script>window.APP_CONFIG={{API_BASE_URL:"{api_url}",DEBUG:{debug}}}</script>'
    if '</head>' in html:
        html = html.replace('</head>', f'{config}\n  </head>')
    return HttpResponse(html, content_type='text/html; charset=utf-8')

urlpatterns = [
    path('management/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/medical-records/', include('medical_records.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/patient-identity/', include('patient_identity.urls')),
    path('api/portal/', include('patients.patient_portal_urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/sms/', include('sms_notifications.urls')),
    path('api/backup/', include('backup.urls')),
    path('api/online-booking/', include('online_booking.urls')),
    path('api/health/', HealthCheckView.as_view()),

    # Public config for frontend (no auth needed)
    path('api/config/', public_config, name='public-config'),

    # Swagger / OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Static assets and media files (always serve, even without DEBUG)
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': os.path.join(settings.FRONTEND_DIST_DIR, 'assets')}),
    re_path(r'^fonts/(?P<path>.*)$', serve, {'document_root': os.path.join(settings.FRONTEND_DIST_DIR, 'fonts')}),
    re_path(r'^images/(?P<path>.*)$', serve, {'document_root': os.path.join(settings.FRONTEND_DIST_DIR, 'images')}),
    re_path(r'^samples/(?P<path>.*)$', serve, {'document_root': os.path.join(settings.FRONTEND_DIST_DIR, 'samples')}),
    re_path(r'^(?P<path>manifest\.json|sw\.js|vite\.svg|favicon\.ico)$', serve, {'document_root': settings.FRONTEND_DIST_DIR}),
    re_path(r'^icons/(?P<path>.*)$', serve, {'document_root': os.path.join(settings.FRONTEND_DIST_DIR, 'icons')}),
    re_path(r'^media/(?P<path>.*)$', serve_media),
    re_path(r'^portal/(?P<path>.*)$', serve, {'document_root': os.path.join(settings.BASE_DIR.parent, 'frontend', 'portal')}),
    re_path(r'^(?!api/|management/|media/|portal/)', serve_frontend),
]

