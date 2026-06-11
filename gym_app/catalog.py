"""Catálogo de planes de membresía y características adicionales.

"""

MEMBERSHIP_PLANS = {
    "basic": {
        "name": "Basic",
        "cost": 50,
        "available": True,
        "benefits": ["Acceso a sala de máquinas", "Horario regular (6am-10pm)"],
    },
    "premium": {
        "name": "Premium",
        "cost": 120,
        "available": True,
        "benefits": [
            "Acceso a sala de máquinas",
            "Horario 24/7",
            "Acceso a piscina",
            "Invitado gratis 1 vez al mes",
        ],
    },
    "family": {
        "name": "Family",
        "cost": 180,
        "available": True,
        "benefits": [
            "Acceso para hasta 4 familiares",
            "Horario 24/7",
            "Acceso a piscina",
            "Clases para niños",
        ],
    },
    "student": {
        "name": "Student",
        "cost": 35,
        "available": False,  
        "benefits": ["Acceso a sala de máquinas", "Horario reducido"],
    },
}

ADDITIONAL_FEATURES = {
    "personal_training": {
        "name": "Sesiones de entrenamiento personal",
        "cost": 30,
        "available": True,
        "premium": False,
    },
    "group_classes": {
        "name": "Clases grupales",
        "cost": 20,
        "available": True,
        "premium": False,
    },
    "nutrition_plan": {
        "name": "Plan nutricional",
        "cost": 25,
        "available": True,
        "premium": False,
    },
    "exclusive_facilities": {
        "name": "Acceso a instalaciones exclusivas",
        "cost": 60,
        "available": True,
        "premium": True,
    },
    "specialized_program": {
        "name": "Programa de entrenamiento especializado",
        "cost": 80,
        "available": True,
        "premium": True,
    },
    "spa_access": {
        "name": "Acceso al spa",
        "cost": 40,
        "available": False,  
        "premium": True,
    },
}


def get_plan(plan_id: str) -> dict | None:
    """Retorna el plan o None si no existe."""
    return MEMBERSHIP_PLANS.get(plan_id)


def get_feature(feature_id: str) -> dict | None:
    """Retorna la característica o None si no existe."""
    return ADDITIONAL_FEATURES.get(feature_id)


def is_plan_available(plan_id: str) -> bool:
    plan = get_plan(plan_id)
    return plan is not None and plan["available"]


def is_feature_available(feature_id: str) -> bool:
    feature = get_feature(feature_id)
    return feature is not None and feature["available"]


def has_premium_features(feature_ids: list[str]) -> bool:
    """True si al menos una de las características es premium."""
    return any(
        (feature := get_feature(fid)) is not None and feature["premium"]
        for fid in feature_ids
    )


def available_plans() -> dict:
    """Planes disponibles para mostrar en el menú."""
    return {pid: p for pid, p in MEMBERSHIP_PLANS.items() if p["available"]}


def available_features() -> dict:
    """Características disponibles para mostrar en el menú."""
    return {fid: f for fid, f in ADDITIONAL_FEATURES.items() if f["available"]}