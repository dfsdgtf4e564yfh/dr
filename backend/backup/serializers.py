from rest_framework import serializers


class BackupInfoSerializer(serializers.Serializer):
    filename = serializers.CharField()
    size = serializers.IntegerField()
    created = serializers.CharField()
    engine = serializers.CharField()
