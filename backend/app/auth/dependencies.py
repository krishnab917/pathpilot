from fastapi import Depends, Header, HTTPException, status
from supabase import AsyncClient, acreate_client
from app.core.config import get_settings

async def get_supabase_client() -> AsyncClient:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Supabase authentication is not configured.")
    return await acreate_client(settings.supabase_url, settings.supabase_anon_key)

async def current_user_id(authorization: str | None = Header(default=None), client: AsyncClient = Depends(get_supabase_client)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="A Supabase access token is required.")
    try:
        response = await client.auth.get_user(authorization.removeprefix("Bearer "))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="The Supabase access token is invalid.") from exc
    if not response.user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="The Supabase access token is invalid.")
    return response.user.id
