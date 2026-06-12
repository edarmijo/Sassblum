"""Cálculo de costos, descuentos y recargos.

Orden de cálculo (ver supuestos en README):
  1. subtotal = (costo del plan + características) * miembros
  2. recargo premium 15% si incluye alguna característica premium
  3. descuento grupal 10% si hay 2 o más miembros
  4. oferta especial: > $400 → -$50, si no > $200 → -$20 (solo la mayor)
  5. redondeo al entero más cercano
"""

from gym_app import catalog, validation

GROUP_DISCOUNT_RATE = 0.10
PREMIUM_SURCHARGE_RATE = 0.15
# (umbral, descuento) ordenados de mayor a menor: solo aplica el primero que se cumpla
SPECIAL_OFFERS = [(400, 50), (200, 20)]


def base_cost(plan_id: str) -> int:
    """Costo base del plan. Lanza ValueError si el plan es inválido."""
    validation.validate_plan(plan_id)
    return catalog.get_plan(plan_id)["cost"]


def features_cost(feature_ids: list[str]) -> int:
    """Suma de las características. Lanza ValueError si alguna es inválida."""
    validation.validate_features(feature_ids)
    return sum(catalog.get_feature(fid)["cost"] for fid in feature_ids)


def special_offer_discount(total: float) -> int:
    """Descuento de oferta especial según el total (estrictamente mayor)."""
    for threshold, discount in SPECIAL_OFFERS:
        if total > threshold:
            return discount
    return 0


def calculate_total(plan_id: str, feature_ids: list[str], members: int = 1) -> int:
    """Costo total de la membresía aplicando recargos y descuentos.

    Retorna el total como entero positivo. Lanza ValueError si alguna
    entrada es inválida (el llamador decide si convertirlo en -1).
    """
    validation.validate_members(members)
    subtotal = (base_cost(plan_id) + features_cost(feature_ids)) * members

    if catalog.has_premium_features(feature_ids):
        subtotal *= 1 + PREMIUM_SURCHARGE_RATE

    if members >= 2:
        subtotal *= 1 - GROUP_DISCOUNT_RATE

    subtotal -= special_offer_discount(subtotal)

    return round(subtotal)


def build_summary(plan_id: str, feature_ids: list[str], members: int) -> dict:
    """Desglose del cálculo para mostrar en la confirmación (regla 8)."""
    plan = catalog.get_plan(plan_id)
    base = base_cost(plan_id)
    extras = features_cost(feature_ids)
    subtotal = (base + extras) * members

    has_premium = catalog.has_premium_features(feature_ids)
    surcharge = subtotal * PREMIUM_SURCHARGE_RATE if has_premium else 0
    after_surcharge = subtotal + surcharge

    group_discount = after_surcharge * GROUP_DISCOUNT_RATE if members >= 2 else 0
    after_group = after_surcharge - group_discount

    offer = special_offer_discount(after_group)

    return {
        "plan_name": plan["name"],
        "feature_names": [catalog.get_feature(f)["name"] for f in feature_ids],
        "members": members,
        "base_cost": base,
        "features_cost": extras,
        "subtotal": subtotal,
        "premium_surcharge": surcharge,
        "group_discount": group_discount,
        "special_offer": offer,
        "total": round(after_group - offer),
    }
