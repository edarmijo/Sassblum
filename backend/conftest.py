"""
Root pytest fixtures for the backend suite.

The production settings enable SECURE_SSL_REDIRECT when DJANGO_DEBUG=False,
which makes Django's test client receive 301 redirects to https://testserver
instead of real responses. Tests must not depend on the developer's .env,
so the redirect is disabled for every test run.
"""

import pytest


@pytest.fixture(autouse=True)
def _disable_ssl_redirect(settings):
    settings.SECURE_SSL_REDIRECT = False
