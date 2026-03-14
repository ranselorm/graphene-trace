from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Admin login endpoint with JWT tokens
    Expects: { "email": "admin@example.com", "password": "password123" }
    Returns: JWT access and refresh tokens with user info
    """
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authenticate user
    user = authenticate(request, username=email, password=password)
    
    if user is not None:
        # Check if user is admin
        if user.role != 'admin':
            return Response(
                {'error': 'Only admin users can log in'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'created_at': user.created_at,
            }
        }, status=status.HTTP_200_OK)
    else:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint - with JWT, client just discards the token
    This endpoint can be used to blacklist the refresh token if needed
    """
    return Response(
        {'message': 'Logout successful'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Get current logged-in user info from JWT token
    """
    user = request.user
    return Response({
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'created_at': user.created_at,
    }, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    """
    Get all users - requires authentication
    """
    from .models import User
    users = User.objects.all()
    users_data = [{
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'username': user.username,
        'created_at': user.created_at,
    } for user in users]
    
    return Response(users_data, status=status.HTTP_200_OK)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upsert_user(request):
    """
    Create new user if 'id' not provided, else update existing user
    """
    user_id = request.data.get('id', None)

    if user_id:
        # Update existing user
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        serializer = UserSerializer(user, data=request.data, partial=True)  # partial=True allows updating only provided fields
    else:
        # Create new user
        serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    else:
        return Response(serializer.errors, status=400)