from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Creates an admin user if one does not exist'

    def handle(self, *args, **options):
        admin_email = "admin@example.com"
        
        if User.objects.filter(email=admin_email).exists():
            self.stdout.write(
                self.style.WARNING(f'Admin user with email {admin_email} already exists')
            )
        else:
            admin = User.objects.create_user(
                username='admin',
                email=admin_email,
                password='admin123',
                full_name='Admin User',
                role='admin',
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(
                self.style.SUCCESS('Admin user created successfully!')
            )
            self.stdout.write(f'Email: {admin_email}')
            self.stdout.write(f'Password: admin123')
            self.stdout.write(
                self.style.WARNING('Please change the password after first login!')
            )
