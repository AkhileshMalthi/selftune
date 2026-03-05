"""
Re-export all SQLModel table classes so that a single
`import app.models` registers every model with SQLModel metadata.
"""

from app.models.user import User  # noqa: F401
