from app.models.schemas import CareerAnalysisResponse
from app.services.ai_client import StructuredAIClient

class CareerService:
    """Career-analysis use case; route handlers and UI do not own prompt composition."""
    def __init__(self, ai_client: StructuredAIClient) -> None:
        self._ai_client = ai_client

    async def analyze(self, profile_context: dict) -> CareerAnalysisResponse:
        response = await self._ai_client.generate(
            system="You are PathPilot's career discovery service. Return exactly five distinct, age-appropriate career matches and do not make outcome guarantees.",
            user=f"Student profile: {profile_context}",
            response_model=CareerAnalysisResponse,
        )
        names = {match.career_name.strip().lower() for match in response.matches}
        if len(response.matches) != 5 or len(names) != 5:
            raise ValueError("Career analysis must contain exactly five distinct matches.")
        return response
