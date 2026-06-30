"""
ForgotPasswordSerializer — validates the email for a reset request (SRP).
One serializer per operation. No business logic; the view delegates to TokenService.
"""

from rest_framework import serializers


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
