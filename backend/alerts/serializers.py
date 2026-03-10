from rest_framework import serializers
from .models import Alert


class AlertSerializer(serializers.ModelSerializer):
    """
    Serializer for Alert model
    Converts Alert objects to JSON and adds computed fields
    """
    # These are computed fields that don't exist in the model
    patient_name = serializers.SerializerMethodField()
    patient_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Alert
        fields = [
            'id',
            'patient',
            'patient_name',
            'patient_email',
            'sensor_frame',
            'alert_type',
            'severity',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_patient_name(self, obj):
        """Get the patient's full name from the related user"""
        if obj.patient and obj.patient.patient:
            return obj.patient.patient.full_name
        return "Unknown"
    
    def get_patient_email(self, obj):
        """Get the patient's email from the related user"""
        if obj.patient and obj.patient.patient:
            return obj.patient.patient.email
        return "Unknown"
    
    # def get_time_ago(self, obj):
    #     """Convert timestamp to human-readable format like '2 minutes ago'"""
    #     return timesince(obj.created_at) + " ago"
