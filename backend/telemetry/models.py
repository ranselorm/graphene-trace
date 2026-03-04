from django.db import models

# Create your models here.

class SensorFrame(models.Model):
    id = models.BigAutoField(primary_key=True)  # bigint primary key
    session_id = models.IntegerField()  # Foreign key could be added if you have a Session model
    timestamp = models.DateTimeField()  # timestamp
    
    # Data storage
    raw_matrix_data = models.JSONField()
    
    # Pre-calculated metrics
    peak_pressure_index = models.IntegerField(null=True, blank=True)
    contact_area_percentage = models.FloatField(null=True, blank=True)
    risk_score = models.FloatField(null=True, blank=True)
    
    # Smart alert logic
    is_flagged_alert = models.BooleanField(default=False)
    
    class Meta:
        db_table = "pressure_frames"
        
    
    def __str__(self):
        return f"PressureFrame {self.id} (Session {self.session_id})"