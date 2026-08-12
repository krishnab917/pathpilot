from typing import Protocol
from app.models.schemas import CareerAnalysisResponse, MentorMessageResponse, RoadmapMilestone

class StudentRepository(Protocol):
    async def profile_context(self, user_id: str) -> dict: ...

class CareerRepository(Protocol):
    async def replace_matches(self, user_id: str, result: CareerAnalysisResponse) -> None: ...

class RoadmapRepository(Protocol):
    async def create(self, user_id: str, target_career: str, milestones: list[RoadmapMilestone]) -> dict: ...

class MentorRepository(Protocol):
    async def append_exchange(self, user_id: str, content: str, response: MentorMessageResponse) -> None: ...
