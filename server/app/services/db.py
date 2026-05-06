from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.collection import Collection
from app.models.workspace import Workspace


def get_workspace(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> Workspace:
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id, Workspace.owner_id == user_id
    ).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


def get_collection(
    collection_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> Collection:
    collection = (
        db.query(Collection)
        .join(Workspace, Collection.workspace_id == Workspace.id)
        .filter(Collection.id == collection_id, Workspace.owner_id == user_id)
        .first()
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection
