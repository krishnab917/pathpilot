from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import current_user_id
from app.models.schemas import MentorMessageRequest, MentorMessageResponse
from app.services.ai_client import AIProviderNotConfigured, UnconfiguredAIClient
from app.services.mentor_service import MentorService
router = APIRouter()
@router.post("/messages", response_model=MentorMessageResponse)
async def send_message(request: MentorMessageRequest, user_id: str = Depends(current_user_id)) -> MentorMessageResponse:
    try: return await MentorService(UnconfiguredAIClient()).respond(user_id, request, {"user_id": user_id})
    except AIProviderNotConfigured as exc: raise HTTPException(status_code=503, detail=str(exc)) from exc
