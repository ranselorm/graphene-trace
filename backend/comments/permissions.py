from rest_framework.permissions import BasePermission, SAFE_METHODS
from patients.models import PatientProfile
from telemetry.models import SensorFrame


def is_admin(user):
    return bool(getattr(user, "is_superuser", False) or getattr(user, "role", "") == "admin")


def is_clinician(user):
    return getattr(user, "role", "") == "clinician"


def is_patient(user):
    return getattr(user, "role", "") == "patient"


def get_user_patient_profile(user):
    # PatientProfile.patient -> accounts.User
    return PatientProfile.objects.filter(patient=user).first()


class CanAccessSensorFrame(BasePermission):
    """
    Controls access to comment list, create, retrieve based on sensor_frame access.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True


class IsAuthorOrAdmin(BasePermission):
    """
    Only author or admin can update or delete a comment.
    """

    def has_object_permission(self, request, view, obj):
        if is_admin(request.user):
            return True
        return obj.user_id == request.user.id