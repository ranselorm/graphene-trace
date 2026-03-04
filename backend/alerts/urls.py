from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlertViewSet

# Router automatically creates URLs for all ViewSet actions
router = DefaultRouter()
router.register(r'', AlertViewSet, basename='alert')

# This creates the following URLs:
# GET    /api/alerts/                    - List all alerts
# POST   /api/alerts/                    - Create alert
# GET    /api/alerts/{id}/               - Get single alert
# PUT    /api/alerts/{id}/               - Update alert
# PATCH  /api/alerts/{id}/               - Partial update
# DELETE /api/alerts/{id}/               - Delete alert
# GET    /api/alerts/latest/             - Get latest alerts
# GET    /api/alerts/by_severity/        - Get severity counts
# GET    /api/alerts/by_status/          - Get status counts
# PATCH  /api/alerts/{id}/mark_reviewed/ - Mark as reviewed
# PATCH  /api/alerts/{id}/mark_resolved/ - Mark as resolved

urlpatterns = [
    path('', include(router.urls)),
]
