from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MedicalRecordViewSet, CommonDiagnosisViewSet, CommonDrugViewSet, CommonTreatmentPlanViewSet, TmsFormViewSet, VisitTemplateViewSet, DicomFileViewSet

router = DefaultRouter()
router.register('common-diagnoses', CommonDiagnosisViewSet)
router.register('common-drugs', CommonDrugViewSet)
router.register('common-treatment-plans', CommonTreatmentPlanViewSet)
router.register('tms-forms', TmsFormViewSet)
router.register('visit-templates', VisitTemplateViewSet)
router.register('dicom-files', DicomFileViewSet)
router.register('', MedicalRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
