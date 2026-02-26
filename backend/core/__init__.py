"""Core app package.

Exposes the Celery application as ``core.celery.app`` so it can be
used by the Celery CLI.
"""

from .celery import app as celery_app

__all__ = ["celery_app"]

