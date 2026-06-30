"""VerifyEmailSerializer / LogoutSerializer — single-field token serializers (SRP)."""

from rest_framework import serializers


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()
