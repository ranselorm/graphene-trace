from django.db import models

# Create your models here.


class TestTable(models.Model):
    email = models.CharField(max_length=100)
    value = models.IntegerField()
   
    passwords = models.CharField(max_length=255, null=True, blank=True)
    role = models.CharField(max_length=255, null=True, blank=True)
    def __str__(self):
        return f"{self.name}: {self.value}"