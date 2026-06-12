
import pytest

from gym_app import validation


class TestValidatePlan:
    def test_valid_plan_passes(self):
        validation.validate_plan("premium")

    def test_unknown_plan_raises(self):
        with pytest.raises(ValueError, match="no existe"):
            validation.validate_plan("diamante")

    def test_unavailable_plan_raises(self):
        with pytest.raises(ValueError, match="no está disponible"):
            validation.validate_plan("student")


class TestValidateFeatures:
    def test_empty_list_passes(self):
        validation.validate_features([])

    def test_valid_features_pass(self):
        validation.validate_features(["personal_training", "group_classes"])

    def test_unknown_feature_raises(self):
        with pytest.raises(ValueError, match="no existe"):
            validation.validate_features(["crossfit"])

    def test_unavailable_feature_raises(self):
        with pytest.raises(ValueError, match="no está disponible"):
            validation.validate_features(["spa_access"])

    def test_duplicated_features_raise(self):
        with pytest.raises(ValueError, match="repetidas"):
            validation.validate_features(["group_classes", "group_classes"])


class TestValidateMembers:
    def test_one_member_passes(self):
        validation.validate_members(1)

    def test_group_passes(self):
        validation.validate_members(5)

    def test_zero_members_raises(self):
        with pytest.raises(ValueError, match="al menos 1"):
            validation.validate_members(0)

    def test_negative_members_raises(self):
        with pytest.raises(ValueError, match="al menos 1"):
            validation.validate_members(-3)

    def test_non_integer_raises(self):
        with pytest.raises(ValueError, match="entero"):
            validation.validate_members(2.5)

    def test_bool_raises(self):
        with pytest.raises(ValueError, match="entero"):
            validation.validate_members(True)
