"""add organizations.webhook_url + webhook_secret (outbound webhooks); latest migration

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-31

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("organizations", sa.Column("webhook_url", sa.String(500), nullable=True))
    op.add_column("organizations", sa.Column("webhook_secret", sa.String(128), nullable=True))


def downgrade() -> None:
    op.drop_column("organizations", "webhook_secret")
    op.drop_column("organizations", "webhook_url")
