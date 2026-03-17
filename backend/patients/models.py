from django.conf import settings
from django.db import models

# Create your models here.

class PatientProfile(models.Model):

    #Ref: users.id < patient_profiles.patient_id
    #Primary key is the user ID itself ( 1 to 1 field )

    patient = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete = models.CASCADE,
        primary_key=True,
        related_name='patient_profile'
    )

    #Ref : users.id < patient_profile.clinician_id

    clinician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_patients',
        limit_choices_to={'role': 'clinician'} #ensures only clinicians are assigned
    )

    date_of_birth = models.DateField(null=True, blank=True)
    medical_notes = models.TextField(blank=True, null=True)

    #matches risk categories as either high, medium, low

    RISK_CHOICES = [
        ('high','High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    risk_category = models.CharField(max_length=10, choices=RISK_CHOICES, blank=True)

    # Patient-set pain thresholds (pain is subjective, so each patient defines their own)
    pressure_threshold = models.IntegerField(
        default=2000,
        help_text="Pressure value (1-4095) above which the patient considers painful"
    )
    contact_area_threshold = models.FloatField(
        default=50.0,
        help_text="Percentage of contact area that is concerning for this patient"
    )
    duration_threshold = models.IntegerField(
        default=300,
        help_text="Seconds of sustained pressure above threshold before it's risky"
    )

    def __str__(self):
        return f"Profile: {self.patient.fullname}" 