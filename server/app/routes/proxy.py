from fastapi import APIRouter, Depends
from app.schemas.proxy import ProxyRequest
from app.services.proxy_service import forward_request
from app.middleware.auth import get_current_user

router = APIRouter(tags=["proxy"])


@router.post("/proxy")
async def proxy(request: ProxyRequest, _: str = Depends(get_current_user)):

    return await forward_request(
        request.method,
        request.url,
        request.headers,
        request.params,
        request.body,
    )
