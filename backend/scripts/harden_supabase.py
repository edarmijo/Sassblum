"""Apply reversible Supabase database hardening verified for this project.

Usage:
    python scripts/harden_supabase.py          # print planned SQL only
    python scripts/harden_supabase.py --execute
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from django.db import connection  # noqa: E402


STATEMENTS = (
    "CREATE SCHEMA IF NOT EXISTS extensions",
    "ALTER TABLE public.catalog_service_image ENABLE ROW LEVEL SECURITY",
    "ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog",
    "ALTER FUNCTION public.uid() SET search_path = pg_catalog",
    "ALTER FUNCTION public.urol() SET search_path = pg_catalog",
    "ALTER FUNCTION public.es_admin() SET search_path = pg_catalog",
    "ALTER EXTENSION citext SET SCHEMA extensions",
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true", help="Apply the listed statements.")
    args = parser.parse_args()

    for statement in STATEMENTS:
        print(statement + ";")
    if not args.execute:
        return

    with connection.cursor() as cursor:
        for statement in STATEMENTS:
            cursor.execute(statement)
        cursor.execute(
            "SELECT relrowsecurity FROM pg_class WHERE oid = 'public.catalog_service_image'::regclass"
        )
        print(f"catalog_service_image RLS: {cursor.fetchone()[0]}")
        cursor.execute(
            "SELECT proname, proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace "
            "WHERE n.nspname = 'public' AND proname IN ('set_updated_at', 'uid', 'urol', 'es_admin') "
            "ORDER BY proname"
        )
        print(f"function search paths: {cursor.fetchall()}")
        cursor.execute("SELECT extnamespace::regnamespace FROM pg_extension WHERE extname = 'citext'")
        print(f"citext schema: {cursor.fetchone()[0]}")
if __name__ == "__main__":
    main()
