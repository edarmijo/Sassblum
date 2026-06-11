"""Interfaz de línea de comandos: menús, selección y confirmación.

run() retorna el total (entero positivo) si el usuario confirma un plan
válido, o -1 si cancela o la entrada es inválida (regla 9).
"""

from gym_app import catalog, pricing, validation


def _show_plans() -> None:
    print("\n=== PLANES DE MEMBRESÍA ===")
    for pid, plan in catalog.available_plans().items():
        print(f"\n  [{pid}] {plan['name']} — ${plan['cost']}/mes")
        for benefit in plan["benefits"]:
            print(f"      - {benefit}")


def _show_features() -> None:
    print("\n=== CARACTERÍSTICAS ADICIONALES ===")
    for fid, feature in catalog.available_features().items():
        tag = "  [PREMIUM +15% recargo]" if feature["premium"] else ""
        print(f"  [{fid}] {feature['name']} — ${feature['cost']}{tag}")


def _ask_plan() -> str:
    """Pide un plan hasta que sea válido y esté disponible (regla 7)."""
    while True:
        _show_plans()
        choice = input("\nEscribe el código del plan: ").strip().lower()
        try:
            validation.validate_plan(choice)
            return choice
        except ValueError as exc:
            print(f"  [X] {exc}")


def _ask_features() -> list[str]:
    """Pide características separadas por coma (vacío = ninguna)."""
    while True:
        _show_features()
        raw = input(
            "\nCódigos de características separados por coma (Enter para ninguna): "
        ).strip().lower()
        if not raw:
            return []
        feature_ids = [f.strip() for f in raw.split(",") if f.strip()]
        try:
            validation.validate_features(feature_ids)
            return feature_ids
        except ValueError as exc:
            print(f"  [X] {exc}")


def _ask_members() -> int:
    """Pide la cantidad de miembros e informa el ahorro grupal (regla 4)."""
    while True:
        raw = input("\n¿Cuántas personas se inscriben juntas? ").strip()
        try:
            members = int(raw)
            validation.validate_members(members)
        except ValueError:
            print("  [X] Ingresa un número entero mayor o igual a 1.")
            continue
        if members >= 2:
            print(f"  [OK] ¡{members} miembros! Se aplicará 10% de descuento grupal.")
        else:
            print("  [i] Inscribiéndote con 1+ acompañantes obtendrías 10% de descuento.")
        return members


def _show_summary(summary: dict) -> None:
    print("\n========= RESUMEN DE TU MEMBRESÍA =========")
    print(f"  Plan:            {summary['plan_name']}  (${summary['base_cost']})")
    if summary["feature_names"]:
        print(f"  Características: {', '.join(summary['feature_names'])}"
              f"  (${summary['features_cost']})")
    else:
        print("  Características: ninguna")
    print(f"  Miembros:        {summary['members']}")
    print(f"  Subtotal:        ${summary['subtotal']:.2f}")
    if summary["premium_surcharge"]:
        print(f"  Recargo premium (15%):  +${summary['premium_surcharge']:.2f}")
    if summary["group_discount"]:
        print(f"  Descuento grupal (10%): -${summary['group_discount']:.2f}")
    if summary["special_offer"]:
        print(f"  Oferta especial:        -${summary['special_offer']:.2f}")
    print(f"  TOTAL:           ${summary['total']}")
    print("===========================================")


def run() -> int:
    """Flujo completo. Retorna el total confirmado o -1 (regla 9)."""
    print("Bienvenido al sistema de membresías del gimnasio")
    try:
        plan_id = _ask_plan()
        feature_ids = _ask_features()
        members = _ask_members()

        summary = pricing.build_summary(plan_id, feature_ids, members)
        _show_summary(summary)

        confirm = input("\n¿Confirmas tu membresía? (s/n): ").strip().lower()
        if confirm != "s":
            print("Membresía cancelada.")
            return -1

        total = pricing.calculate_total(plan_id, feature_ids, members)
        print(f"\n[OK] ¡Membresía confirmada! Total a pagar: ${total}")
        return total

    except ValueError as exc:
        print(f"\n[X] Error: {exc}")
        return -1
    except (KeyboardInterrupt, EOFError):
        print("\nOperación cancelada por el usuario.")
        return -1
