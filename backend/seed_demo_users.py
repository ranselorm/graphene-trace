#!/usr/bin/env python3
"""Run the Django demo-user seed command from backend root."""

from pathlib import Path
import subprocess
import sys


BACKEND_DIR = Path(__file__).resolve().parent
MANAGE_PY = BACKEND_DIR / "manage.py"
VENV_PYTHON = BACKEND_DIR / ".venv" / "bin" / "python"

if not MANAGE_PY.exists():
    raise FileNotFoundError(f"manage.py not found at {MANAGE_PY}")

python_executable = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable

subprocess.run(
    [python_executable, str(MANAGE_PY), "seed_demo_users"],
    cwd=str(BACKEND_DIR),
    check=True,
)
