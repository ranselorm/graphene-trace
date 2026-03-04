from django.contrib import admin
from .models import PatientProfile


# Register your models here.

@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("patient", "clinician", "date_of_birth", "risk_category")
    search_fields = ("patient__username", "patient__email")
    list_filter = ("clinician", "risk_category")