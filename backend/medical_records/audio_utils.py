import os
import uuid
from django.conf import settings


def save_audio_file(audio_data, filename=None):
    upload_dir = os.path.join(settings.MEDIA_ROOT, 'voice_notes')
    os.makedirs(upload_dir, exist_ok=True)
    if not filename:
        filename = f"{uuid.uuid4()}.webm"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, 'wb') as f:
        f.write(audio_data)
    return os.path.join('voice_notes', filename)


def transcribe_audio(file_path):
    return "[متن تشخیص داده شده از روی صوت]"
