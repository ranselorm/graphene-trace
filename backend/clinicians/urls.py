from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClinicianViewSet

router = DefaultRouter()
router.register(r'', ClinicianViewSet, basename='clinician')

urlpatterns = [
    path('', include(router.urls)),
]
