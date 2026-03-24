from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_csv, name='telemetry-upload'),
    path('sessions/', views.list_sessions, name='telemetry-sessions'),
    path('sessions/<int:session_id>/metrics/', views.session_metrics, name='telemetry-session-metrics'),
    path('sessions/<int:session_id>/frames/', views.session_frames, name='telemetry-session-frames'),
    path('sessions/<int:session_id>/heatmap/', views.session_heatmap, name='telemetry-session-heatmap'),
]
