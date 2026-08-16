from django.conf import settings


def test_credentialed_origins_are_exact() -> None:
    assert getattr(settings, "CORS_ALLOWED_ORIGIN_REGEXES", []) == []
    assert all("*" not in origin for origin in settings.CORS_ALLOWED_ORIGINS)
    assert settings.WS_ALLOWED_ORIGINS == settings.CORS_ALLOWED_ORIGINS


def test_refresh_cookie_defaults_to_lax() -> None:
    assert settings.AUTH_COOKIE_SAMESITE == "Lax"
