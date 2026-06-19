import os
import json
import logging
import re
from datetime import datetime

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GITHUB_API = 'https://api.github.com'
RELEASE_PREFIX = 'backup-'


def _get_config():
    from .models import GitHubBackupConfig
    cfg = GitHubBackupConfig.objects.filter(id=1).first()
    return cfg


def _headers(token=None):
    if token is None:
        cfg = _get_config()
        token = cfg.token if cfg and cfg.token else (cfg.oauth_token if cfg else '')
    return {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/vnd.github.v3+json',
    }


def _parse_repo(repo_full: str):
    repo_full = repo_full.strip()
    if '/' not in repo_full:
        return None, None
    parts = repo_full.split('/', 1)
    return parts[0].strip(), parts[1].strip()


def _get_upload_url(release_data: dict) -> str:
    url = release_data.get('upload_url', '')
    return url.split('{')[0] if url else ''


def test_connection(repo: str, token: str) -> dict:
    owner, repo_name = _parse_repo(repo)
    if not owner or not repo_name:
        return {'success': False, 'error': 'فرمت ریپازیتوری نامعتبر است. از owner/repo استفاده کنید.'}
    url = f'{GITHUB_API}/repos/{owner}/{repo_name}'
    try:
        resp = requests.get(url, headers=_headers(token), timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            return {
                'success': True,
                'repo': data.get('full_name'),
                'private': data.get('private', False),
                'description': data.get('description', ''),
            }
        elif resp.status_code == 401:
            return {'success': False, 'error': 'توکن نامعتبر است. دسترسی رد شد.'}
        elif resp.status_code == 404:
            return {'success': False, 'error': 'ریپازیتوری یافت نشد. دسترسی به آن را بررسی کنید.'}
        else:
            return {'success': False, 'error': f'خطای {resp.status_code}: {resp.text[:200]}'}
    except requests.exceptions.Timeout:
        return {'success': False, 'error': 'زمان اتصال به GitHub تمام شد.'}
    except requests.exceptions.ConnectionError:
        return {'success': False, 'error': 'خطا در اتصال به GitHub. اینترنت خود را بررسی کنید.'}
    except Exception as e:
        return {'success': False, 'error': str(e)[:200]}


def _create_release(repo: str, token: str, tag: str, name: str, body: str = '') -> dict:
    owner, repo_name = _parse_repo(repo)
    url = f'{GITHUB_API}/repos/{owner}/{repo_name}/releases'
    payload = {
        'tag_name': tag,
        'name': name,
        'body': body,
        'draft': False,
        'prerelease': False,
    }
    resp = requests.post(url, headers=_headers(token), json=payload, timeout=15)
    if resp.status_code in (201, 200):
        return resp.json()
    logger.error(f'Create release failed: {resp.status_code} {resp.text[:300]}')
    raise Exception(f'ایجاد Release ناموفق بود ({resp.status_code}).')


def _upload_asset(upload_url: str, token: str, filepath: str, filename: str) -> dict:
    url = f'{upload_url}?name={filename}'
    headers = _headers(token)
    headers['Content-Type'] = 'application/octet-stream'
    with open(filepath, 'rb') as f:
        resp = requests.post(url, headers=headers, data=f, timeout=120)
    if resp.status_code in (201, 200):
        return resp.json()
    logger.error(f'Upload asset failed: {resp.status_code} {resp.text[:300]}')
    raise Exception(f'آپلود فایل ناموفق بود ({resp.status_code}).')


def _list_releases(repo: str, token: str) -> list:
    owner, repo_name = _parse_repo(repo)
    url = f'{GITHUB_API}/repos/{owner}/{repo_name}/releases?per_page=100'
    resp = requests.get(url, headers=_headers(token), timeout=15)
    if resp.status_code == 200:
        return resp.json()
    return []


def _delete_release(repo: str, token: str, release_id: int):
    owner, repo_name = _parse_repo(repo)
    url = f'{GITHUB_API}/repos/{owner}/{repo_name}/releases/{release_id}'
    resp = requests.delete(url, headers=_headers(token), timeout=15)
    if resp.status_code not in (204, 200):
        logger.warning(f'Delete release {release_id} failed: {resp.status_code}')


def _cleanup_old_releases(repo: str, token: str, keep_last_n: int):
    releases = _list_releases(repo, token)
    backup_releases = [
        r for r in releases
        if r.get('tag_name', '').startswith(RELEASE_PREFIX)
    ]
    backup_releases.sort(key=lambda r: r.get('created_at', ''), reverse=True)
    to_delete = backup_releases[keep_last_n:]
    for r in to_delete:
        logger.info(f'Deleting old release: {r["tag_name"]}')
        _delete_release(repo, token, r['id'])


def upload_backup(filepath: str, filename: str = '') -> dict:
    cfg = _get_config()
    if not cfg or (not cfg.token and not cfg.oauth_token) or not cfg.repo:
        return {'success': False, 'error': 'تنظیمات GitHub انجام نشده است.'}
    if not os.path.isfile(filepath):
        return {'success': False, 'error': 'فایل پشتیبان یافت نشد.'}

    repo = cfg.repo
    token = cfg.token or cfg.oauth_token
    keep_last_n = cfg.keep_last_n
    now = datetime.now()
    tag = f'{RELEASE_PREFIX}{now.strftime("%Y%m%d_%H%M%S")}'
    release_name = f'پشتیبان {now.strftime("%Y-%m-%d %H:%M")}'
    display_filename = filename or os.path.basename(filepath)

    try:
        release = _create_release(repo, token, tag, release_name)
        upload_url = _get_upload_url(release)
        if not upload_url:
            return {'success': False, 'error': 'آدرس آپلود از پاسخ GitHub دریافت نشد.'}

        asset = _upload_asset(upload_url, token, filepath, display_filename)
        logger.info(f'Uploaded backup to GitHub: {asset.get("browser_download_url")}')

        _cleanup_old_releases(repo, token, keep_last_n)

        return {
            'success': True,
            'download_url': asset.get('browser_download_url'),
            'release_url': release.get('html_url'),
            'release_tag': tag,
            'size_bytes': asset.get('size', os.path.getsize(filepath)),
        }
    except Exception as e:
        logger.exception(f'GitHub upload failed: {e}')
        return {'success': False, 'error': str(e)[:300]}
