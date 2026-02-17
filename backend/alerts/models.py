from django.db import models

# Create your models here.

class Alert(models.Model):
    patient = models.ForeignKey("patients.Patient", on_delete=models.CASCADE, related_name="alerts")
    sensor_frame = models.ForeignKey("telemetry.SensorFrame", on_delete=models.CASCADE, related_name="alerts")

    alert_type = models.CharField(max_length=50)
    severity = models.CharField(max_length=20)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["patient", "-created_at"]),
            models.Index(fields=["severity"]),
        ]

    def __str__(self):
        return f"Alert(patient_id={self.patient_id}, type={self.alert_type}, severity={self.severity})"