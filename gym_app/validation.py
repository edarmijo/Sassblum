from gym_app import catalog


def validate_plan(plan_id: str) -> None:
    """El plan debe existir y estar disponible."""
    plan = catalog.get_plan(plan_id)
    if plan is None:
        raise ValueError(f"El plan '{plan_id}' no existe.")
    if not plan["available"]:
        raise ValueError(
            f"El plan '{plan['name']}' no está disponible actualmente. "
            "Por favor selecciona otro plan."
        )


def validate_features(feature_ids: list[str]) -> None:
    """Cada característica debe existir, estar disponible y no repetirse."""
    if len(feature_ids) != len(set(feature_ids)):
        raise ValueError("Hay características repetidas en la selección.")
    for fid in feature_ids:
        feature = catalog.get_feature(fid)
        if feature is None:
            raise ValueError(f"La característica '{fid}' no existe.")
        if not feature["available"]:
            raise ValueError(
                f"La característica '{feature['name']}' no está disponible. "
                "Por favor selecciona otra."
            )


def validate_members(members: int) -> None:
    """La cantidad de miembros debe ser un entero >= 1."""
    if not isinstance(members, int) or isinstance(members, bool):
        raise ValueError("La cantidad de miembros debe ser un número entero.")
    if members < 1:
        raise ValueError("La cantidad de miembros debe ser al menos 1.")
