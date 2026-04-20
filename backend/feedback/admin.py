from django.contrib import admin
from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'feedback_type', 'rating', 'status', 'created_at')
    list_filter = ('feedback_type', 'status', 'rating', 'created_at')
    search_fields = ('title', 'message', 'user__email', 'user__full_name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User Info', {
            'fields': ('user',)
        }),
        ('Feedback Content', {
            'fields': ('feedback_type', 'title', 'message', 'rating')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
