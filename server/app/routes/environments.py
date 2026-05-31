from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.environment import Environment, EnvVariable
from app.schemas.environment import (
    EnvironmentCreate, EnvironmentUpdate, EnvironmentResponse,
    VariableCreate, VariableUpdate, VariableResponse,
)
from app.services.db import get_workspace, get_environment

router = APIRouter(prefix="/environments", tags=["environments"])


# --- Environments ---

@router.get("", response_model=List[EnvironmentResponse])
def list_environments(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    workspace = get_workspace(
        workspace_id=workspace_id, db=db, user_id=user_id)
    return db.query(Environment).filter(Environment.workspace_id == workspace.id).all()


@router.post("", response_model=EnvironmentResponse, status_code=201)
def create_environment(
    data: EnvironmentCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    get_workspace(workspace_id=data.workspace_id, db=db, user_id=user_id)
    environment = Environment(workspace_id=data.workspace_id, name=data.name)
    db.add(environment)
    db.commit()
    db.refresh(environment)
    return environment


@router.put("/{environment_id}", response_model=EnvironmentResponse)
def update_environment(
    data: EnvironmentUpdate,
    environment: Environment = Depends(get_environment),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(environment, field, value)
    db.commit()
    db.refresh(environment)
    return environment


@router.delete("/{environment_id}", status_code=204)
def delete_environment(
    environment: Environment = Depends(get_environment),
    db: Session = Depends(get_db),
):
    db.delete(environment)
    db.commit()


@router.post("/{environment_id}/activate", response_model=EnvironmentResponse)
def activate_environment(
    environment: Environment = Depends(get_environment),
    db: Session = Depends(get_db),
):
    db.query(Environment).filter(
        Environment.workspace_id == environment.workspace_id,
        Environment.id != environment.id,
    ).update({"is_active": False})
    environment.is_active = True
    db.commit()
    db.refresh(environment)
    return environment


# --- Variables ---

@router.get("/{environment_id}/variables", response_model=List[VariableResponse])
def list_variables(
    environment: Environment = Depends(get_environment),
    db: Session = Depends(get_db),
):
    return db.query(EnvVariable).filter(EnvVariable.env_id == environment.id).all()


@router.post("/{environment_id}/variables", response_model=VariableResponse, status_code=201)
def create_variable(
    data: VariableCreate,
    environment: Environment = Depends(get_environment),
    db: Session = Depends(get_db),
):
    variable = EnvVariable(
        env_id=environment.id,
        key=data.key,
        value=data.value,
        is_secret=data.is_secret,
    )
    db.add(variable)
    db.commit()
    db.refresh(variable)
    return variable


@router.put("/{environment_id}/variables/{variable_id}", response_model=VariableResponse)
def update_variable(
    variable_id: UUID,
    data: VariableUpdate,
    environment: Environment = Depends(get_environment),
    db: Session = Depends(get_db),
):
    variable = db.query(EnvVariable).filter(
        EnvVariable.id == variable_id, EnvVariable.env_id == environment.id
    ).first()
    if not variable:
        raise HTTPException(status_code=404, detail="Variable not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(variable, field, value)
    db.commit()
    db.refresh(variable)
    return variable


@router.delete("/{environment_id}/variables/{variable_id}", status_code=204)
def delete_variable(
    variable_id: UUID,
    environment: Environment = Depends(get_environment),
    db: Session = Depends(get_db),
):
    variable = db.query(EnvVariable).filter(
        EnvVariable.id == variable_id, EnvVariable.env_id == environment.id
    ).first()
    if not variable:
        raise HTTPException(status_code=404, detail="Variable not found")
    db.delete(variable)
    db.commit()


# ---- Search ----
@router.get("/search", response_model=list[EnvironmentResponse])
def search_environments(
    workspace_id: UUID,
    query: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    get_workspace(workspace_id=workspace_id, db=db, user_id=user_id)

    q = query.strip()
    if not q:
        return []

    return (
        db.query(Environment)
        .filter(
            Environment.workspace_id == workspace_id,
            Environment.name.ilike(f"%{q}%"),
        )
        .order_by(Environment.created_at.desc())
        .limit(20)
        .all()
    )
