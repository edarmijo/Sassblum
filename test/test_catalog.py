"""Tests del catálogo: existencia, disponibilidad y detección de premium."""

from gym_app import catalog


class TestGetters:
    def test_get_plan_existing(self):
        plan = catalog.get_plan("basic")
        assert plan is not None
        assert plan["name"] == "Basic"
        assert plan["cost"] == 50

    def test_get_plan_unknown_returns_none(self):
        assert catalog.get_plan("inexistente") is None

    def test_get_feature_existing(self):
        feature = catalog.get_feature("group_classes")
        assert feature is not None
        assert feature["cost"] == 20

    def test_get_feature_unknown_returns_none(self):
        assert catalog.get_feature("yoga_aereo") is None


class TestAvailability:
    def test_basic_plan_is_available(self):
        assert catalog.is_plan_available("basic") is True

    def test_student_plan_is_not_available(self):
        assert catalog.is_plan_available("student") is False

    def test_unknown_plan_is_not_available(self):
        assert catalog.is_plan_available("inexistente") is False

    def test_spa_access_is_not_available(self):
        assert catalog.is_feature_available("spa_access") is False

    def test_available_plans_excludes_unavailable(self):
        assert "student" not in catalog.available_plans()
        assert "basic" in catalog.available_plans()

    def test_available_features_excludes_unavailable(self):
        assert "spa_access" not in catalog.available_features()
        assert "personal_training" in catalog.available_features()


class TestPremiumDetection:
    def test_no_features_is_not_premium(self):
        assert catalog.has_premium_features([]) is False

    def test_regular_features_are_not_premium(self):
        assert catalog.has_premium_features(["group_classes", "nutrition_plan"]) is False

    def test_one_premium_feature_marks_premium(self):
        assert catalog.has_premium_features(["group_classes", "exclusive_facilities"]) is True