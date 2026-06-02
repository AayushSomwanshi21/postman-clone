"""
Script to populate a workspace with random collections.
Usage: python populate_collections.py <workspace_id> [count]
Example: python populate_collections.py 550e8400-e29b-41d4-a716-446655440000 50
"""

# Add parent directory to path FIRST, before any app imports
from contextlib import contextmanager
import string
import random
from uuid import UUID
from pathlib import Path
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.collection import Collection
sys.path.insert(0, str(Path(__file__).parent.parent))


# Now safe to import from app


@contextmanager
def get_db_session():
    """Dependency injection for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_random_name(length: int = 12) -> str:
    """Generate a random collection name."""
    # Generate name like "Collection_ABC123"
    random_part = ''.join(random.choices(
        string.ascii_letters + string.digits, k=length))
    return f"Collection_{random_part}"


def populate_collections(workspace_id: str, count: int = 50, db: Session = None) -> None:
    """
    Populate a workspace with collections.

    Args:
        workspace_id: The UUID of the workspace
        count: Number of collections to create (default: 50)
        db: Database session (injected dependency)
    """
    def _populate(db_session: Session) -> None:
        try:
            # Validate workspace_id is a valid UUID
            workspace_uuid = UUID(workspace_id)
        except ValueError:
            print(
                f"Error: Invalid workspace ID '{workspace_id}'. Must be a valid UUID.")
            sys.exit(1)

        try:
            # Check if workspace exists
            from app.models.workspace import Workspace
            workspace = db_session.query(Workspace).filter(
                Workspace.id == workspace_uuid).first()
            if not workspace:
                print(f"Error: Workspace with ID '{workspace_id}' not found.")
                sys.exit(1)

            print(
                f"Creating {count} collections in workspace: {workspace.name} ({workspace_id})")

            # Create collections
            collections = []
            for i in range(count):
                collection = Collection(
                    workspace_id=workspace_uuid,
                    name=generate_random_name(),
                    description=f"Auto-generated collection {i+1}/{count}"
                )
                collections.append(collection)

            # Batch insert
            db_session.add_all(collections)
            db_session.commit()

            print(f"✓ Successfully created {count} collections!")

        except Exception as e:
            db_session.rollback()
            print(f"Error: {str(e)}")
            sys.exit(1)

    # Use injected session or create one
    if db:
        _populate(db)
    else:
        with get_db_session() as db_session:
            _populate(db_session)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python populate_collections.py <workspace_id> [count]")
        print("Example: python populate_collections.py 550e8400-e29b-41d4-a716-446655440000 50")
        sys.exit(1)

    workspace_id = sys.argv[1]
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 50

    populate_collections(workspace_id, count)
