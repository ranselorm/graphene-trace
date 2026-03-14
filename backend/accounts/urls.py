from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.current_user, name='current_user'),
    path('get_all_users/', views.get_all_users, name='get_all_users'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('upsert_user/', views.upsert_user, name ='upsert_user'),
]
