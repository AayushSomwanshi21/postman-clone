from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.proxy import router as proxy_router
from app.routes.collections import router as collections_router
from app.routes.workspaces import router as workspaces_router
from app.routes.environments import router as environments_router
from app.routes.documents import router as documents_router
from app.services.proxy_service import startup_proxy_client, shutdown_proxy_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    await startup_proxy_client()
    yield
    await shutdown_proxy_client()

app = FastAPI(title="Postman Clone API", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(auth_router)
app.include_router(proxy_router)
app.include_router(workspaces_router)
app.include_router(collections_router)
app.include_router(environments_router)
app.include_router(documents_router)


@app.get("/health")
def health():
    return {"status": "ok"}
