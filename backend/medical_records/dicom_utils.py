import os
import uuid
from django.conf import settings

UPLOAD_DIR = 'dicom_files'
THUMB_DIR = 'dicom_thumbnails'


def save_dicom_file(file_data, filename=None):
    upload_dir = os.path.join(settings.MEDIA_ROOT, UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)
    if not filename:
        filename = f"{uuid.uuid4()}.dcm"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, 'wb') as f:
        f.write(file_data)
    return os.path.join(UPLOAD_DIR, filename)


def parse_dicom_metadata(file_path):
    try:
        import pydicom
        ds = pydicom.dcmread(file_path, force=True)
        return {
            'patient_name': str(getattr(ds, 'PatientName', '')),
            'patient_id': str(getattr(ds, 'PatientID', '')),
            'study_date': str(getattr(ds, 'StudyDate', '')),
            'modality': str(getattr(ds, 'Modality', '')),
            'study_description': str(getattr(ds, 'StudyDescription', '')),
            'series_description': str(getattr(ds, 'SeriesDescription', '')),
            'rows': int(getattr(ds, 'Rows', 0)),
            'columns': int(getattr(ds, 'Columns', 0)),
            'sop_class': str(getattr(ds, 'SOPClassUID', '')),
            'study_uid': str(getattr(ds, 'StudyInstanceUID', '')),
            'series_uid': str(getattr(ds, 'SeriesInstanceUID', '')),
        }
    except ImportError:
        return {
            'filename': os.path.basename(file_path),
            'size_bytes': os.path.getsize(file_path),
            'note': 'pydicom not installed',
        }
    except Exception:
        return {'error': 'Failed to parse DICOM', 'filename': os.path.basename(file_path)}


def dicom_to_png(dicom_path, output_path=None):
    try:
        import pydicom
        import numpy as np
        from PIL import Image
        ds = pydicom.dcmread(dicom_path, force=True)
        pixel_array = ds.pixel_array
        pixel_array = ((pixel_array - pixel_array.min()) /
                      (pixel_array.max() - pixel_array.min() + 1e-8) * 255).astype(np.uint8)
        img = Image.fromarray(pixel_array)
        if output_path is None:
            output_path = dicom_path.replace('.dcm', '.png').replace('.DCM', '.png')
        img.save(output_path)
        return output_path
    except Exception:
        return None


def generate_thumbnail(dicom_path):
    thumb_dir = os.path.join(settings.MEDIA_ROOT, THUMB_DIR)
    os.makedirs(thumb_dir, exist_ok=True)
    thumb_name = f"{uuid.uuid4()}.png"
    thumb_path = os.path.join(thumb_dir, thumb_name)
    result = dicom_to_png(dicom_path, thumb_path)
    if result:
        return os.path.join(THUMB_DIR, thumb_name)
    return None
