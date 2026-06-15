from django.urls import path
from . import views

urlpatterns = [
    path('', views.backup_list, name='backup-list'),
    path('full-export/', views.full_backup_download, name='full-backup-export'),
    path('download-database/', views.download_database, name='download-database'),
    path('download/<str:filename>/', views.backup_download, name='backup-download'),
    path('delete/<str:filename>/', views.backup_delete, name='backup-delete'),
    path('restore/', views.backup_restore, name='backup-restore'),
    path('restore-media/<str:filename>/', views.restore_media, name='restore-media'),
    path('restore-env/<str:filename>/', views.restore_env, name='restore-env'),
    path('schedule/', views.backup_schedule, name='backup-schedule'),
    path('logs/', views.backup_logs, name='backup-logs'),
    path('verify/', views.backup_verify, name='backup-verify'),

    # Email backup
    path('email/config/', views.email_config, name='email-config'),
    path('email/test/', views.email_test, name='email-test'),
    path('email/send/', views.email_send_backup, name='email-send'),

    # GitHub backup
    path('github/config/', views.github_config, name='github-config'),
    path('github/test/', views.github_test, name='github-test'),
    path('github/upload/', views.github_upload, name='github-upload'),

    # GitHub OAuth
    path('github/auth-url/', views.github_auth_url, name='github-auth-url'),
    path('github/callback/', views.github_callback, name='github-callback'),
    path('github/disconnect/', views.github_disconnect, name='github-disconnect'),
    path('github/repos/', views.github_list_repos, name='github-repos'),
    path('github/status/', views.github_status, name='github-status'),
]
