from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.collection import Collection, Request
from app.schemas.collection import (
    CollectionCreate, CollectionUpdate, CollectionResponse, CollectionWithRequests,
    RequestCreate, RequestUpdate, RequestResponse,
)
from app.services.db import get_workspace, get_collection

router = APIRouter(prefix="/collections", tags=["collections"])


# --- Collections ---

@router.get("", response_model=List[CollectionResponse])
def list_collections(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    workspace = get_workspace(workspace_id=workspace_id, db=db, user_id=user_id)
    return db.query(Collection).filter(Collection.workspace_id == workspace.id).all()


@router.post("", response_model=CollectionResponse, status_code=201)
def create_collection(
    data: CollectionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    get_workspace(workspace_id=data.workspace_id, db=db, user_id=user_id)
    collection = Collection(
        workspace_id=data.workspace_id,
        name=data.name,
        description=data.description,
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return collection


@router.get("/{collection_id}", response_model=CollectionWithRequests)
def get_collection_with_requests(
    collection: Collection = Depends(get_collection),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(Request)
        .filter(Request.collection_id == collection.id)
        .order_by(Request.position)
        .all()
    )
    return CollectionWithRequests(
        id=collection.id,
        workspace_id=collection.workspace_id,
        name=collection.name,
        description=collection.description,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
        requests=[RequestResponse.model_validate(r) for r in requests],
    )


@router.put("/{collection_id}", response_model=CollectionResponse)
def update_collection(
    data: CollectionUpdate,
    collection: Collection = Depends(get_collection),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(collection, field, value)
    db.commit()
    db.refresh(collection)
    return collection


@router.delete("/{collection_id}", status_code=204)
def delete_collection(
    collection: Collection = Depends(get_collection),
    db: Session = Depends(get_db),
):
    db.delete(collection)
    db.commit()


# --- Requests ---

@router.get("/{collection_id}/requests", response_model=List[RequestResponse])
def list_requests(
    collection: Collection = Depends(get_collection),
    db: Session = Depends(get_db),
):
    return (
        db.query(Request)
        .filter(Request.collection_id == collection.id)
        .order_by(Request.position)
        .all()
    )


@router.post("/{collection_id}/requests", response_model=RequestResponse, status_code=201)
def create_request(
    data: RequestCreate,
    collection: Collection = Depends(get_collection),
    db: Session = Depends(get_db),
):
    request = Request(
        collection_id=collection.id,
        name=data.name,
        method=data.method,
        url=data.url,
        headers=data.headers,
        params=data.params,
        path_vars=data.path_vars,
        body=data.body,
        auth=data.auth,
        description=data.description,
        position=data.position,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.put("/{collection_id}/requests/{request_id}", response_model=RequestResponse)
def update_request(
    request_id: UUID,
    data: RequestUpdate,
    collection: Collection = Depends(get_collection),
    db: Session = Depends(get_db),
):
    request = db.query(Request).filter(
        Request.id == request_id, Request.collection_id == collection.id
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(request, field, value)
    db.commit()
    db.refresh(request)
    return request


@router.delete("/{collection_id}/requests/{request_id}", status_code=204)
def delete_request(
    request_id: UUID,
    collection: Collection = Depends(get_collection),
    db: Session = Depends(get_db),
):
    request = db.query(Request).filter(
        Request.id == request_id, Request.collection_id == collection.id
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    db.delete(request)
    db.commit()
