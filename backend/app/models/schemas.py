from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, HttpUrl

Priority = Literal["low", "medium", "high"]
MilestoneCategory = Literal["skill", "project", "experience"]

class ResourceLink(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    url: HttpUrl

class CareerMatch(BaseModel):
    career_name: str = Field(min_length=2, max_length=180)
    match_score: int = Field(ge=0, le=100)
    reasoning: str
    strengths: list[str]
    missing_skills: list[str]
    reality_check: str
    next_steps: list[str]

class CareerAnalysisResponse(BaseModel):
    matches: list[CareerMatch] = Field(min_length=5, max_length=5)

class RoadmapGenerationRequest(BaseModel):
    target_career: str = Field(min_length=2, max_length=180)

class GeneratedRoadmap(BaseModel):
    milestones: list["RoadmapMilestone"] = Field(min_length=9, max_length=9)

class RoadmapMilestone(BaseModel):
    year: int = Field(ge=1, le=3)
    title: str = Field(min_length=2, max_length=180)
    description: str
    category: MilestoneCategory
    deadline: datetime | None = None
    priority: Priority
    estimated_hours: int = Field(ge=1, le=1000)
    resources: list[ResourceLink] = []

class SimulationChoice(BaseModel):
    id: str
    label: str
    technical_impact: int = Field(ge=0, le=100)
    leadership_impact: int = Field(ge=0, le=100)
    compatibility_impact: int = Field(ge=0, le=100)

class SimulationScenario(BaseModel):
    id: str
    title: str
    prompt: str
    choices: list[SimulationChoice] = Field(min_length=3, max_length=3)

class SimulationEvaluationRequest(BaseModel):
    career: str
    scenarios: list[SimulationScenario] = Field(min_length=3, max_length=3)
    selections: list[dict[str, str]] = Field(min_length=3, max_length=3)

class SimulationResult(BaseModel):
    technical_score: int
    leadership_score: int
    career_compatibility_score: int
    score: int
    feedback: str

class MentorMessageRequest(BaseModel):
    conversation_id: str | None = None
    content: str = Field(min_length=1, max_length=3000)

class MentorMessageResponse(BaseModel):
    conversation_id: str
    reply: str
