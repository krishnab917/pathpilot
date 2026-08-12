from app.models.schemas import MentorMessageRequest, MentorMessageResponse
from app.services.ai_client import StructuredAIClient

class MentorService:
    def __init__(self, ai_client: StructuredAIClient) -> None:
        self._ai_client = ai_client
    async def respond(self, user_id: str, request: MentorMessageRequest, context: dict) -> MentorMessageResponse:
        system = "You are PathPilot's supportive, age-appropriate career mentor. Provide practical guidance without guarantees, diagnoses, or pressure. Use the supplied private student context."
        user = f"Student context: {context}\n\nStudent message: {request.content}"
        response = await self._ai_client.generate(system=system, user=user, response_model=MentorMessageResponse)
        return response.model_copy(update={"conversation_id": request.conversation_id or response.conversation_id})
