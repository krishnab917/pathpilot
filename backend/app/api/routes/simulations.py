from fastapi import APIRouter, HTTPException
from app.domain.simulation.engine import SimulationEngine
from app.models.schemas import SimulationEvaluationRequest, SimulationResult
router = APIRouter()
@router.post("/evaluate", response_model=SimulationResult)
async def evaluate_simulation(request: SimulationEvaluationRequest) -> SimulationResult:
    try: return SimulationEngine().evaluate(request)
    except ValueError as exc: raise HTTPException(status_code=422, detail=str(exc)) from exc
