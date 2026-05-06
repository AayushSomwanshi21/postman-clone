from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse
from app.services.db import get_workspace

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return db.query(Workspace).filter(Workspace.owner_id == user_id).all()


@router.post("", response_model=WorkspaceResponse, status_code=201)
def create_workspace(
    data: WorkspaceCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    workspace = Workspace(owner_id=user_id, name=data.name)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(
    data: WorkspaceUpdate,
    workspace: Workspace = Depends(get_workspace),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(workspace, field, value)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.delete("/{workspace_id}", status_code=204)
def delete_workspace(
    workspace: Workspace = Depends(get_workspace),
    db: Session = Depends(get_db),
):
    db.delete(workspace)
    db.commit()
