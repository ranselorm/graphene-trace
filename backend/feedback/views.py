from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Feedback
from .serializers import FeedbackSerializer
from clinicians.permissions import IsAdminRole


class FeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            # Admins see all feedback
            return Feedback.objects.all()
        else:
            # Non-admins only see their own feedback
            return Feedback.objects.filter(user=user)

    def perform_create(self, serializer):
        """Set the user to the current user when creating feedback"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['GET'], permission_classes=[IsAdminRole])
    def all(self, request):
        """Admin endpoint to get all feedback with optional filtering"""
        queryset = Feedback.objects.all()

        # Optional filters
        feedback_type = request.query_params.get('type')
        status_filter = request.query_params.get('status')
        rating_filter = request.query_params.get('rating')

        if feedback_type:
            queryset = queryset.filter(feedback_type=feedback_type)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if rating_filter:
            queryset = queryset.filter(rating=rating_filter)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'], permission_classes=[IsAdminRole])
    def stats(self, request):
        """Admin endpoint to get feedback statistics"""
        total = Feedback.objects.count()
        by_type = {}
        by_status = {}
        avg_rating = 0

        for feedback_type, _ in Feedback.FEEDBACK_TYPES:
            by_type[feedback_type] = Feedback.objects.filter(
                feedback_type=feedback_type
            ).count()

        for status_choice, _ in Feedback.STATUS_CHOICES:
            by_status[status_choice] = Feedback.objects.filter(
                status=status_choice
            ).count()

        ratings = Feedback.objects.values_list('rating', flat=True)
        if ratings:
            avg_rating = sum(ratings) / len(ratings)

        return Response({
            'total': total,
            'by_type': by_type,
            'by_status': by_status,
            'average_rating': round(avg_rating, 2),
        })
