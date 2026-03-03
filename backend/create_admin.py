"""
Script to create an admin user
Run with: python manage.py shell < create_admin.py
Or manually in Django shell
"""
from accounts.models import User

# Check if admin exists
admin_email = "admin@example.com"
if User.objects.filter(email=admin_email).exists():
    print(f"Admin user with email {admin_email} already exists")
else:
    # Create admin user
    admin = User.objects.create_user(
        username='admin',
        email=admin_email,
        password='admin123',  # Change this password!
        full_name='Admin User',
        role='admin',
        is_staff=True,
        is_superuser=True
    )
    print(f"Admin user created successfully!")
    print(f"Email: {admin_email}")
    print(f"Password: admin123")
    print("Please change the password after first login!")
