from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import current_user_id
from app.models.schemas import CareerAnalysisResponse
from app.services.ai_client import AIProviderNotConfigured, UnconfiguredAIClient
from app.services.career_service import CareerService
router = APIRouter()
@router.post("/analyze", response_model=CareerAnalysisResponse)
async def analyze_careers(user_id: str = Depends(current_user_id)) -> CareerAnalysisResponse:
    try: return await CareerService(UnconfiguredAIClient()).analyze({"user_id": user_id})
    except AIProviderNotConfigured as exc: raise HTTPException(status_code=503, detail=str(exc)) from exc
