from django.db import models

class Session(models.Model):
    id = models.AutoField(primary_key=True)  
    patient_id = models.IntegerField()  
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    session_date = models.DateField(null=True, blank=True)
    notes = models.TextField(
        null=True, 
        blank=True
    )

    class Meta:
        db_table = "sessions"
        

    def __str__(self):
        return f"Session {self.id} (Patient {self.patient_id})"