from rest_framework import serializers
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "sensor_frame",
            "user",
            "user_name",
            "user_email",
            "user_role",
            "body",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "user", "user_name", "user_email", "user_role"]

    def get_user_name(self, obj):
        return getattr(obj.user, "full_name", None) or getattr(obj.user, "username", None) or "Unknown"

    def get_user_email(self, obj):
        return getattr(obj.user, "email", None) or "Unknown"

    def get_user_role(self, obj):
        return getattr(obj.user, "role", None) or "unknown"
    