from fastapi import HTTPException, Depends
from sqlalchemy.orm import Query, Session
from uuid import UUID

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.collection import Collection
from app.models.document import Document
from app.models.workspace import Workspace
from app.models.environment import Environment
from app.schemas.pagination import PaginatedResponse


def mark_collection_document_stale(
    collection_id: UUID,
    db: Session,
) -> None:
    document = (
        db.query(Document)
        .filter(Document.collection_id == collection_id)
        .first()
    )
    if document and not document.is_stale:
        document.is_stale = True


def paginate_query(
    query: Query,
    *,
    limit: int,
    offset: int,
) -> PaginatedResponse:
    total = query.order_by(None).count()
    items = query.offset(offset).limit(limit).all()
    return PaginatedResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + len(items) < total,
    )


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


def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> Document:
    document = (
        db.query(Document)
        .join(Collection, Document.collection_id == Collection.id)
        .join(Workspace, Collection.workspace_id == Workspace.id)
        .filter(Document.id == document_id, Workspace.owner_id == user_id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


def get_environment(
    environment_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> Environment:
    environment = (
        db.query(Environment)
        .join(Workspace, Environment.workspace_id == Workspace.id)
        .filter(Environment.id == environment_id, Workspace.owner_id == user_id)
        .first()
    )
    if not environment:
        raise HTTPException(status_code=404, detail="Environment not found")
    return environment
