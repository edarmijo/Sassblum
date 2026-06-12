"""Tests del cálculo de costos, descuentos y recargos.

Valores de referencia del catálogo:
  Planes: basic=50, premium=120, family=180
  Características: personal_training=30, group_classes=20, nutrition_plan=25,
                   exclusive_facilities=60 (premium), specialized_program=80 (premium)
"""

import pytest

from gym_app import pricing


class TestBaseAndFeaturesCost:
    def test_base_cost(self):
        assert pricing.base_cost("basic") == 50
        assert pricing.base_cost("premium") == 120

    def test_base_cost_invalid_plan_raises(self):
        with pytest.raises(ValueError):
            pricing.base_cost("diamante")

    def test_features_cost_empty(self):
        assert pricing.features_cost([]) == 0

    def test_features_cost_sum(self):
        assert pricing.features_cost(["personal_training", "group_classes"]) == 50

    def test_features_cost_unavailable_raises(self):
        with pytest.raises(ValueError):
            pricing.features_cost(["spa_access"])


class TestSpecialOfferDiscount:
    def test_below_first_threshold(self):
        assert pricing.special_offer_discount(150) == 0

    def test_exactly_200_no_discount(self):
        # "exceeds" es estrictamente mayor (supuesto 3 del README)
        assert pricing.special_offer_discount(200) == 0

    def test_just_above_200(self):
        assert pricing.special_offer_discount(200.01) == 20

    def test_exactly_400_gets_only_20(self):
        assert pricing.special_offer_discount(400) == 20

    def test_above_400_gets_50_not_70(self):
        # los descuentos no son acumulables: aplica solo el mayor
        assert pricing.special_offer_discount(400.01) == 50


class TestCalculateTotal:
    def test_plan_only(self):
        assert pricing.calculate_total("basic", [], 1) == 50

    def test_plan_with_features(self):
        # 50 + 30 + 20 = 100
        assert pricing.calculate_total(
            "basic", ["personal_training", "group_classes"], 1
        ) == 100

    def test_group_discount_10_percent(self):
        # (50 * 2) * 0.90 = 90
        assert pricing.calculate_total("basic", [], 2) == 90

    def test_premium_surcharge_15_percent(self):
        # (50 + 60) * 1.15 = 126.5 → 126 (round de Python, half-to-even)
        assert pricing.calculate_total("basic", ["exclusive_facilities"], 1) == 126

    def test_special_offer_over_200(self):
        # 180 + 20 + 25 = 225 (sin premium) → 225 - 20 = 205
        assert pricing.calculate_total(
            "family", ["group_classes", "nutrition_plan"], 1
        ) == 205

    def test_exactly_200_no_special_offer(self):
        # 180 + 20 = 200 exacto → sin descuento
        assert pricing.calculate_total("family", ["group_classes"], 1) == 200

    def test_special_offer_over_400_with_group(self):
        # (180+30+25)*2 = 470 → grupal: 423 → -50 = 373
        assert pricing.calculate_total(
            "family", ["personal_training", "nutrition_plan"], 2
        ) == 373

    def test_premium_plus_group_plus_offer(self):
        # (120+60+80)*2 = 520 → premium: 598 → grupal: 538.2 → -50 = 488.2 → 488
        assert pricing.calculate_total(
            "premium", ["exclusive_facilities", "specialized_program"], 2
        ) == 488

    def test_result_is_positive_int(self):
        total = pricing.calculate_total("premium", ["specialized_program"], 3)
        assert isinstance(total, int)
        assert total > 0

    def test_invalid_plan_raises(self):
        with pytest.raises(ValueError):
            pricing.calculate_total("diamante", [], 1)

    def test_unavailable_feature_raises(self):
        with pytest.raises(ValueError):
            pricing.calculate_total("basic", ["spa_access"], 1)

    def test_invalid_members_raises(self):
        with pytest.raises(ValueError):
            pricing.calculate_total("basic", [], 0)


class TestBuildSummary:
    def test_summary_total_matches_calculate_total(self):
        args = ("premium", ["exclusive_facilities", "group_classes"], 2)
        summary = pricing.build_summary(*args)
        assert summary["total"] == pricing.calculate_total(*args)

    def test_summary_fields(self):
        summary = pricing.build_summary("basic", ["group_classes"], 1)
        assert summary["plan_name"] == "Basic"
        assert summary["feature_names"] == ["Clases grupales"]
        assert summary["base_cost"] == 50
        assert summary["features_cost"] == 20
        assert summary["premium_surcharge"] == 0
        assert summary["group_discount"] == 0
        assert summary["total"] == 70
