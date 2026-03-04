"""
Script to create an admin user
Run with: python manage.py shell < create_admin.py
"""
from accounts.models import User

admin_email = "admin@example.com"
admin_username = "admin"
admin_password = "admin123"

admin, created = User.objects.get_or_create(
    email=admin_email,
    defaults={
        "username": admin_username,
        "full_name": "Admin User",
        "role": "admin",
        "is_staff": True,
        "is_superuser": True,
        "is_active": True,
    },
)

# Ensure the flags and password are always correct
admin.username = admin_username
admin.full_name = getattr(admin, "full_name", "Admin User") or "Admin User"
admin.role = "admin"
admin.is_staff = True
admin.is_superuser = True
admin.is_active = True
admin.set_password(admin_password)
admin.save()

if created:
    print("Admin user created successfully!")
else:
    print("Admin user already existed. Updated flags and password.")

print(f"Email: {admin_email}")
print(f"Password: {admin_password}")