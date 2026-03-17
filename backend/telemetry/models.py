from django.db import models


class PressureSession(models.Model):
    """Groups all frames from a single CSV upload (~5 min session)."""
    patient = models.ForeignKey(
        "patients.PatientProfile",
        on_delete=models.CASCADE,
        related_name="pressure_sessions"
    )
    session_date = models.DateTimeField()
    duration_seconds = models.FloatField(null=True, blank=True)
    total_frames = models.IntegerField(default=0)
    filename = models.CharField(max_length=255)

    # Session-level average metrics (computed after all frames processed)
    avg_peak_pressure = models.FloatField(null=True, blank=True)
    avg_contact_area = models.FloatField(null=True, blank=True)
    avg_pressure = models.FloatField(null=True, blank=True)
    avg_risk_score = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["patient", "-session_date"]),
        ]
        ordering = ['-session_date']

    def __str__(self):
        return f"Session(patient={self.patient_id}, date={self.session_date}, frames={self.total_frames})"


class SensorFrame(models.Model):
    """Raw 32x32 pressure frame for heat map display."""
    patient = models.ForeignKey(
        "patients.PatientProfile",
        on_delete=models.CASCADE,
        related_name="sensor_frames"
    )
    session = models.ForeignKey(
        PressureSession,
        on_delete=models.CASCADE,
        related_name="frames",
        null=True,
        blank=True
    )
    frame_number = models.IntegerField(default=0)
    timestamp = models.DateTimeField()
    data = models.JSONField()  # 32x32 matrix stored as list of lists

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["patient", "-timestamp"]),
            models.Index(fields=["session", "frame_number"]),
        ]

    def __str__(self):
        return f"SensorFrame(patient={self.patient_id}, session={self.session_id}, frame={self.frame_number})"


class FrameMetrics(models.Model):
    """Computed metrics for each frame, used for graphs/timeline."""
    sensor_frame = models.OneToOneField(
        SensorFrame,
        on_delete=models.CASCADE,
        related_name="metrics"
    )
    session = models.ForeignKey(
        PressureSession,
        on_delete=models.CASCADE,
        related_name="frame_metrics"
    )
    frame_number = models.IntegerField(default=0)
    timestamp = models.DateTimeField()

    # Key metrics
    peak_pressure_index = models.FloatField()       # Highest pressure excluding areas < 10 pixels
    contact_area_percent = models.FloatField()       # % of pixels above lower threshold
    average_pressure = models.FloatField()           # Mean pressure across active pixels
    risk_score = models.FloatField()                 # 0-10, relative to patient's thresholds

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["session", "frame_number"]),
            models.Index(fields=["session", "timestamp"]),
        ]
        ordering = ['frame_number']

    def __str__(self):
        return f"Metrics(session={self.session_id}, frame={self.frame_number}, risk={self.risk_score})"
