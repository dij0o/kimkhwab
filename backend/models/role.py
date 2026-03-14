"""Compatibility exports for role-related ORM models.

Role and Permission are defined in models.employee so the SQLAlchemy
declarative registry only ever sees one mapper per table/class name.
"""

from models.employee import Permission, Role, role_permissions

__all__ = ["Permission", "Role", "role_permissions"]
