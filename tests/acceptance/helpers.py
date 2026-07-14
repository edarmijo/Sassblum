"""
Run-scoped credentials shared by the acceptance suite.

Generated with `secrets` at import time: deterministic within a single pytest
run (fixtures and tests see the same value) but never hard-coded in the source.
"""

import secrets

# Password every conftest fixture user is created with.
TEST_PASSWORD = f"Aa1!{secrets.token_urlsafe(12)}"

# Password used when a test registers a brand-new account.
NEW_USER_PASSWORD = f"Bb2!{secrets.token_urlsafe(12)}"

# Guaranteed-wrong password for negative login tests.
WRONG_PASSWORD = f"Zz9!{secrets.token_urlsafe(12)}"

# Classic SQL-injection payload (attack input, not a credential).
SQLI_PAYLOAD = "' OR 1=1 --"
