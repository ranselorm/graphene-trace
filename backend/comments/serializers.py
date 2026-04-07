from rest_framework import serializers
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "sensor_frame",
            "user",
            "user_name",
            "user_email",
            "user_role",
            "parent",
            "body",
            "replies",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "user", "user_name", "user_email", "user_role", "replies"]

    def get_user_name(self, obj):
        return getattr(obj.user, "full_name", None) or getattr(obj.user, "username", None) or "Unknown"

    def get_user_email(self, obj):
        return getattr(obj.user, "email", None) or "Unknown"

    def get_user_role(self, obj):
        return getattr(obj.user, "role", None) or "unknown"

    def get_replies(self, obj):
        # Return nested replies
        replies = obj.replies.all().order_by('created_at')
        return CommentSerializer(replies, many=True, context=self.context).data
    