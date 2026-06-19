import pytest
from django.conf import settings
import os


class TestBackupAPI:
    def test_backup_list(self, auth_client):
        response = auth_client.get('/api/backup/')
        assert response.status_code == 200

    def test_backup_create(self, auth_client):
        response = auth_client.post('/api/backup/')
        assert response.status_code == 201

    def test_backup_schedule_get(self, auth_client):
        response = auth_client.get('/api/backup/schedule/')
        assert response.status_code == 200
        assert 'hour' in response.data
        assert 'minute' in response.data


class TestCloudBackupConfig:
    def test_cloud_config_get(self, auth_client):
        response = auth_client.get('/api/backup/cloud/config/')
        assert response.status_code == 200
        assert 'enabled' in response.data

    def test_cloud_config_post(self, auth_client):
        response = auth_client.post('/api/backup/cloud/config/', {
            'enabled': False,
            'provider': 'google_drive',
        })
        assert response.status_code == 200


@pytest.mark.smoke
class TestBackupSmoke:
    def test_backup_endpoints_exist(self, auth_client):
        response = auth_client.get('/api/backup/')
        assert response.status_code < 500
