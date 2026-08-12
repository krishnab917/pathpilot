from app.domain.roadmap.policy import RoadmapPolicy
from app.models.schemas import GeneratedRoadmap, RoadmapGenerationRequest, RoadmapMilestone
from app.services.ai_client import StructuredAIClient

class RoadmapService:
    def __init__(self, ai_client: StructuredAIClient, policy: RoadmapPolicy) -> None:
        self._ai_client, self._policy = ai_client, policy
    async def generate(self, user_context: dict, request: RoadmapGenerationRequest) -> list[RoadmapMilestone]:
        response = await self._ai_client.generate(system="You are PathPilot's roadmap service. Return exactly nine milestones: one skill, project, and experience item for each of three years. Do not promise outcomes.", user=f"Target career: {request.target_career}\nStudent context: {user_context}", response_model=GeneratedRoadmap)
        self._policy.validate(response.milestones)
        return response.milestones
