"""
URL routing for the authentication API. Mounted under /api/auth/ by config/urls.py.
"""

from django.urls import path

from apps.authentication.views import (
    RegisterView,
    LoginView,
    LogoutView,
    VerifyEmailView,
    ForgotPasswordView,
    ResetPasswordView,
    ProfileView,
    CookieTokenRefreshView,
    ChangePasswordView,
)

urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login", LoginView.as_view(), name="login"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("token/refresh", CookieTokenRefreshView.as_view(), name="token-refresh"),
    path("verify-email", VerifyEmailView.as_view(), name="verify-email"),
    path("perfil", ProfileView.as_view(), name="perfil"),
    path("forgot-password", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password", ResetPasswordView.as_view(), name="reset-password"),
    path("cambiar-password", ChangePasswordView.as_view(), name="cambiar-password"),
]
