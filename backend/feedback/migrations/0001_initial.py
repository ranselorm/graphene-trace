# Generated migration for Feedback model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Feedback',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('feedback_type', models.CharField(choices=[('bug', 'Bug Report'), ('feature', 'Feature Request'), ('ux', 'UX/Usability'), ('other', 'Other')], max_length=20)),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('rating', models.IntegerField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')])),
                ('status', models.CharField(choices=[('new', 'New'), ('reviewed', 'Reviewed'), ('in_progress', 'In Progress'), ('resolved', 'Resolved')], default='new', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='feedbacks', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='feedback',
            index=models.Index(fields=['-created_at'], name='feedback_fe_created_idx'),
        ),
        migrations.AddIndex(
            model_name='feedback',
            index=models.Index(fields=['status'], name='feedback_fe_status_idx'),
        ),
    ]
