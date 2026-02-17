from django.conf import settings
from django.db import models

# Create your models here.


class Comment(models.Model):
    sensor_frame = models.ForeignKey("telemetry.SensorFrame", on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")

    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["sensor_frame", "-created_at"]),
        ]

    def __str__(self):
        return f"Comment(user_id={self.user_id}, sensor_frame_id={self.sensor_frame_id})"