"""Vercel serverless entry point: exposes the FastAPI app."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from aura.api import app  # noqa: E402

__all__ = ["app"]
