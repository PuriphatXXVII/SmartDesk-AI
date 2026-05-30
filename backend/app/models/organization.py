import secrets
import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models._base import TimestampMixin, UUIDPrimaryKey
from app.models._types import GUID


def generate_widget_key() -> str:
    """Public, embeddable key (safe to expose in client HTML). Maps to one org."""
    return f"wk_{secrets.token_urlsafe(24)}"


class Organization(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    plan: Mapped[str] = mapped_column(String(32), default="free", nullable=False)
    widget_key: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, default=generate_widget_key
    )
    # Outbound webhooks: org-configured endpoint + secret for HMAC signing (optional).
    webhook_url: Mapped[str | None] = mapped_column(String(500))
    webhook_secret: Mapped[str | None] = mapped_column(String(128))

    users: Mapped[list["User"]] = relationship(back_populates="organization")


class User(Base, UUIDPrimaryKey, TimestampMixin):
    __tablename__ = "users"

    clerk_user_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    org_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    role: Mapped[str] = mapped_column(String(32), default="admin", nullable=False)

    organization: Mapped["Organization"] = relationship(back_populates="users")
