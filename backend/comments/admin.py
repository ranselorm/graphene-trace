from django.contrib import admin
from .models import Comment


# Register your models here.

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "sensor_frame", "created_at")
    search_fields = ("user__username", "user__email", "body")
    ordering = ("-created_at",)