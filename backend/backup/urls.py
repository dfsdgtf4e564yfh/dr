from django.urls import path
from . import views

urlpatterns = [
    path('', views.backup_list, name='backup-list'),
    path('full-export/', views.full_backup_download, name='full-backup-export'),
    path('download-database/', views.download_database, name='download-database'),
    path('download/<str:filename>/', views.backup_download, name='backup-download'),
    path('delete/<str:filename>/', views.backup_delete, name='backup-delete'),
    path('restore/', views.backup_restore, name='backup-restore'),
    path('schedule/', views.backup_schedule, name='backup-schedule'),
    path('logs/', views.backup_logs, name='backup-logs'),

    # Email backup
    path('email/config/', views.email_config, name='email-config'),
    path('email/test/', views.email_test, name='email-test'),
    path('email/send/', views.email_send_backup, name='email-send'),

    # GitHub backup
    path('github/config/', views.github_config, name='github-config'),
    path('github/test/', views.github_test, name='github-test'),
    path('github/upload/', views.github_upload, name='github-upload'),
]
