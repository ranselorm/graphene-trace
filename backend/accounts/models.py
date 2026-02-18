from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    # 'id' and 'password_hash' as password are handled automatically
    email = models.EmailField(unique=True, null=False)
    full_name= models.CharField(max_length=255, blank=True, null=True)

    #Roles : admin, clinician, and patient
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('clinician', 'Clinician'),
        ('patient', 'Patient'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    #using email to login instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    def __str__(self):
        return f"{self.email} ({self.role})"