"""add search indexes

Revision ID: 9f2c1d7b4a6e
Revises: e367432c6048
Create Date: 2026-05-30 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9f2c1d7b4a6e"
down_revision: Union[str, Sequence[str], None] = "e367432c6048"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_collections_workspace_id_name",
        "collections",
        ["workspace_id", "name"],
        unique=False,
    )
    op.create_index(
        "ix_environments_workspace_id_name",
        "environments",
        ["workspace_id", "name"],
        unique=False,
    )
    op.create_index(
        "ix_documents_collection_id",
        "documents",
        ["collection_id"],
        unique=False,
    )
    op.create_index(
        "ix_documents_name",
        "documents",
        ["name"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_documents_collection_id", table_name="documents")
    op.drop_index("ix_documents_name", table_name="documents")
    op.drop_index("ix_environments_workspace_id_name", table_name="environments")
    op.drop_index("ix_collections_workspace_id_name", table_name="collections")
