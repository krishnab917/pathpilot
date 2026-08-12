from dataclasses import dataclass
from app.models.schemas import SimulationEvaluationRequest, SimulationResult

@dataclass(frozen=True)
class SimulationEngine:
    """Pure deterministic scorer. It has no HTTP, database, UI, or AI dependency."""
    def evaluate(self, request: SimulationEvaluationRequest) -> SimulationResult:
        selected = []
        for selection in request.selections:
            scenario = next((item for item in request.scenarios if item.id == selection["scenarioId"]), None)
            choice = next((item for item in scenario.choices if item.id == selection["choiceId"]), None) if scenario else None
            if choice is None:
                raise ValueError("A submitted simulation selection is invalid.")
            selected.append(choice)
        if len(selected) != 3:
            raise ValueError("A completed simulation must contain three selections.")
        technical = round(sum(item.technical_impact for item in selected) / len(selected))
        leadership = round(sum(item.leadership_impact for item in selected) / len(selected))
        compatibility = round(sum(item.compatibility_impact for item in selected) / len(selected))
        score = round((technical + leadership + compatibility) / 3)
        weakest = min(("technical depth", technical), ("leadership judgment", leadership), ("career alignment", compatibility), key=lambda item: item[1])[0]
        return SimulationResult(technical_score=technical, leadership_score=leadership, career_compatibility_score=compatibility, score=score, feedback=f"Your next growth area is {weakest}. Choose one small real-world project where you can practice it and reflect on the outcome.")
