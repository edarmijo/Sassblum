"""
Health check endpoint — verifies database connectivity.

Returns 200 + {"status": "healthy", "database": "ok"} when all checks pass.
Returns 503 + {"status": "unhealthy", ...} when any check fails.

Used by Docker HEALTHCHECK, load balancers, and monitoring tools.
"""

from django.http import JsonResponse
from django.db import connection


def health_check(request):
    checks = {}
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = 'ok'
    except Exception:
        checks['database'] = 'error'

    all_ok = all(v == 'ok' for v in checks.values())
    status_code = 200 if all_ok else 503
    return JsonResponse(
        {'status': 'healthy' if all_ok else 'unhealthy', **checks},
        status=status_code,
    )
