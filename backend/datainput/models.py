from django.conf import settings
from django.db import models
from django.contrib.postgres.fields import ArrayField


class UploadSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="upload_sessions")
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user_id} - {self.file_name}"


class ImageFrame(models.Model):
    session = models.ForeignKey(UploadSession,on_delete=models.CASCADE,related_name="frames")
    frame_index = models.PositiveIntegerField()
    pixels = ArrayField(
        models.FloatField(),
        size=1024,
    )

    def __str__(self):
        return f"Session {self.session_id} Frame {self.frame_index}"


class AnalysisResult(models.Model):
    session = models.ForeignKey(UploadSession,on_delete=models.CASCADE, related_name = "analysis")
    frame = models.OneToOneField(ImageFrame,on_delete=models.CASCADE,related_name="analysis")
    peak_pressure_index = models.FloatField(default=0)
    contact_area_percent = models.FloatField(default=0)
    has_high_pressure = models.BooleanField(default=False)
    flagged_for_review = models.BooleanField(default=False)
    analysed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Analysis for frame {self.frame_id}"