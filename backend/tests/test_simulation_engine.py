from app.domain.simulation.engine import SimulationEngine
from app.models.schemas import SimulationEvaluationRequest, SimulationScenario, SimulationChoice

def test_simulation_engine_scores_selected_choices() -> None:
    scenarios = [SimulationScenario(id=f"s{index}", title="Decision", prompt="A realistic decision.", choices=[SimulationChoice(id="a", label="A", technical_impact=90, leadership_impact=70, compatibility_impact=80), SimulationChoice(id="b", label="B", technical_impact=50, leadership_impact=50, compatibility_impact=50), SimulationChoice(id="c", label="C", technical_impact=40, leadership_impact=40, compatibility_impact=40)]) for index in range(1, 4)]
    result = SimulationEngine().evaluate(SimulationEvaluationRequest(career="Engineer", scenarios=scenarios, selections=[{"scenarioId": "s1", "choiceId": "a"}, {"scenarioId": "s2", "choiceId": "a"}, {"scenarioId": "s3", "choiceId": "a"}]))
    assert result.technical_score == 90
    assert result.leadership_score == 70
    assert result.career_compatibility_score == 80
    assert result.score == 80
