import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


class TestUserModel:
    def test_create_user(self, db):
        user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            role='reception',
        )
        assert user.username == 'testuser'
        assert user.role == 'reception'
        assert user.check_password('testpass123')

    def test_create_admin(self, db):
        user = User.objects.create_superuser(
            username='admin',
            password='admin123',
        )
        assert user.is_superuser
        assert user.is_staff

    def test_user_str(self, db):
        user = User.objects.create_user(
            username='doctor1',
            first_name='علی',
            last_name='احمدی',
            role='doctor',
        )
        assert 'علی احمدی' in str(user)


class TestLoginAPI:
    def test_login_success(self, client, db):
        User.objects.create_user(username='test', password='test123', role='reception')
        response = client.post('/api/auth/login/', {
            'username': 'test',
            'password': 'test123',
        })
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_fail(self, client, db):
        response = client.post('/api/auth/login/', {
            'username': 'nonexistent',
            'password': 'wrong',
        })
        assert response.status_code == 401

    def test_login_empty_password(self, client, db):
        response = client.post('/api/auth/login/', {
            'username': 'test',
            'password': '',
        })
        assert response.status_code == 401


class TestUserAPI:
    def test_list_users(self, auth_client, doctor_user):
        response = auth_client.get('/api/auth/users/')
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_me_endpoint(self, auth_client, admin_user):
        response = auth_client.get('/api/auth/users/me/')
        assert response.status_code == 200
        assert response.data['username'] == 'admin'

    def test_create_user(self, auth_client):
        response = auth_client.post('/api/auth/users/', {
            'username': 'newuser',
            'password': 'pass123456',
            'role': 'reception',
            'first_name': 'new',
            'last_name': 'user',
        })
        assert response.status_code == 201
        assert User.objects.filter(username='newuser').exists()


@pytest.mark.smoke
class TestHealthEndpoint:
    def test_health_check(self, client, db):
        response = client.get('/api/health/')
        assert response.status_code == 200
