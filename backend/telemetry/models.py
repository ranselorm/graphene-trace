from django.db import models

# Create your models here.

class SensorFrame(models.Model):
    patient = models.ForeignKey("patients.Patient", on_delete=models.CASCADE, related_name="sensor_frames")
    timestamp = models.DateTimeField()
    data = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["patient", "-timestamp"]),
        ]

    def __str__(self):
        return f"SensorFrame(patient_id={self.patient_id}, ts={self.timestamp})"