"""add organizations.widget_key (public embeddable key)

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-29

"""
import secrets
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add nullable first, backfill existing rows with unique keys, then enforce constraints.
    op.add_column("organizations", sa.Column("widget_key", sa.String(64), nullable=True))

    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id FROM organizations")).fetchall()
    for (org_id,) in rows:
        conn.execute(
            sa.text("UPDATE organizations SET widget_key = :k WHERE id = :id"),
            {"k": f"wk_{secrets.token_urlsafe(24)}", "id": org_id},
        )

    op.alter_column("organizations", "widget_key", nullable=False)
    op.create_index("ix_organizations_widget_key", "organizations", ["widget_key"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_organizations_widget_key", table_name="organizations")
    op.drop_column("organizations", "widget_key")
