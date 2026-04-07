from django.shortcuts import render

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Comment
from .serializers import CommentSerializer
from .permissions import is_admin, is_clinician, is_patient, get_user_patient_profile, IsAuthorOrAdmin
from telemetry.models import SensorFrame


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = (
            Comment.objects.all()
            .select_related("user", "sensor_frame", "sensor_frame__patient", "sensor_frame__patient__patient")
            .order_by("-created_at")
        )

        sensor_frame_id = self.request.query_params.get("sensor_frame")
        if sensor_frame_id:
            qs = qs.filter(sensor_frame_id=sensor_frame_id)

        user = self.request.user

        # Admin sees all
        if is_admin(user) or is_clinician(user):
            return qs

        # Patient sees only comments on their sensor frames
        if is_patient(user):
            profile = get_user_patient_profile(user)
            if not profile:
                return qs.none()
            return qs.filter(sensor_frame__patient=profile)

        return qs.none()

    def _ensure_can_access_sensor_frame(self, sensor_frame: SensorFrame):
        user = self.request.user

        if is_admin(user) or is_clinician(user):
            return

        if is_patient(user):
            profile = get_user_patient_profile(user)
            if not profile or sensor_frame.patient_id != profile.pk:
                raise PermissionDenied("You do not have access to this sensor frame.")
            return

        raise PermissionDenied("Not allowed.")

    def perform_create(self, serializer):
        sensor_frame = serializer.validated_data.get("sensor_frame")
        self._ensure_can_access_sensor_frame(sensor_frame)
        serializer.save(user=self.request.user)

    def get_permissions(self):
        # For update and delete, enforce author or admin
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsAuthorOrAdmin()]
        return super().get_permissions()
# Create your views here.
