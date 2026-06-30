"""
Auth DRF views — HTTP orchestration only (SRP + DIP).

Each view depends on IAuthService (via get_auth_service()), never on the concrete class.
Declares only the permission it needs (ISP). No business logic, no ORM.

Endpoints:
    POST /api/auth/register       → RegisterView   (AllowAny)
    POST /api/auth/login          → LoginView      (AllowAny)
    POST /api/auth/logout         → LogoutView     (IsAuthenticated)
    POST /api/auth/verify-email   → VerifyEmailView (AllowAny)
"""

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.authentication.serializers import (
    LoginSerializer,
    RegisterSerializer,
    VerifyEmailSerializer,
    LogoutSerializer,
)
from apps.authentication.services import get_auth_service
from apps.authentication.services.auth_service import (
    AuthenticationFailed,
    AccountLocked,
    EmailNotVerified,
    EmailAlreadyExists,
    PasswordPolicyViolation,
    InvalidVerificationToken,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = get_auth_service().register(serializer.validated_data)
        except EmailAlreadyExists as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        except PasswordPolicyViolation as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        try:
            result = get_auth_service().authenticate(data["email"], data["password"])
        except AuthenticationFailed as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)
        except AccountLocked as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_423_LOCKED)
        except EmailNotVerified as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        return Response(result, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            get_auth_service().logout(serializer.validated_data["refresh"])
        except AuthenticationFailed as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_205_RESET_CONTENT)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = get_auth_service().verify_email(serializer.validated_data["token"])
        except InvalidVerificationToken as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)
