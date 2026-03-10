from rest_framework import serializers
from .models import User
from django.utils.timesince import timesince

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 
        'password',
        'last_login',
        'is_superuser',
        'username', 
        'first_name',
        'last_name',
        'email',
        'is_staff',
        'is_active',
        'date_joined',
        'role', 
        'created_at',
        'updated_at',
        'full_name'
        ]
