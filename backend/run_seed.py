#!/usr/bin/env python
"""
Wrapper to run seed_alerts.py
Usage: python run_seed.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'graphene_trace.settings')
django.setup()

# Now run the seed script
exec(open('seed_alerts.py').read())
