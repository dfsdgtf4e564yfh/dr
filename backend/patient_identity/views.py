import hashlib
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import PatientIdentity
from .serializers import PatientIdentitySerializer, PatientIdentityVerifySerializer


class PatientIdentityViewSet(viewsets.ModelViewSet):
    queryset = PatientIdentity.objects.select_related('patient', 'verified_by').all()
    serializer_class = PatientIdentitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'verify':
            return PatientIdentityVerifySerializer
        return PatientIdentitySerializer

    def get_queryset(self):
        qs = PatientIdentity.objects.select_related('patient', 'verified_by').all()
        patient = self.request.query_params.get('patient')
        if patient:
            qs = qs.filter(patient_id=patient)
        return qs

    def perform_create(self, serializer):
        serializer.save(patient_id=self.request.data.get('patient'))

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        identity = self.get_object()
        serializer = PatientIdentityVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get('verified'):
            identity.verified_at = timezone.now()
            identity.verified_by = request.user
        else:
            identity.verified_at = None
            identity.verified_by = None
        if 'notes' in serializer.validated_data:
            identity.notes = serializer.validated_data['notes']
        identity.save()
        return Response(PatientIdentitySerializer(identity).data)

    @action(detail=True, methods=['post'])
    def register_fingerprint(self, request, pk=None):
        identity = self.get_object()
        fingerprint_data = request.data.get('fingerprint_data', '')
        identity.fingerprint_data = fingerprint_data
        identity.fingerprint_hash = hashlib.sha256(fingerprint_data.encode()).hexdigest()
        identity.save()
        return Response(PatientIdentitySerializer(identity).data)
