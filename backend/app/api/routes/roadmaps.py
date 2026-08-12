from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import current_user_id
from app.models.schemas import RoadmapGenerationRequest
from app.domain.roadmap.policy import RoadmapPolicy
from app.services.ai_client import AIProviderNotConfigured, UnconfiguredAIClient
from app.services.roadmap_service import RoadmapService
router = APIRouter()
@router.post("/generate")
async def generate_roadmap(request: RoadmapGenerationRequest, user_id: str = Depends(current_user_id)) -> dict:
    try: milestones = await RoadmapService(UnconfiguredAIClient(), RoadmapPolicy()).generate({"user_id": user_id}, request)
    except AIProviderNotConfigured as exc: raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"targetCareer": request.target_career, "milestones": [item.model_dump(mode="json") for item in milestones]}
