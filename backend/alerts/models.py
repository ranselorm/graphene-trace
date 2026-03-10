from django.db import models

# Create your models here.

class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved'),
    ]
    
    patient = models.ForeignKey("patients.PatientProfile", on_delete=models.CASCADE, related_name="alerts")
    sensor_frame = models.ForeignKey("telemetry.SensorFrame", on_delete=models.CASCADE, related_name="alerts")

    alert_type = models.CharField(max_length=50)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='low')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["patient", "-created_at"]),
            models.Index(fields=["severity"]),
            models.Index(fields=["status"]),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Alert(patient_id={self.patient_id}, type={self.alert_type}, severity={self.severity})"