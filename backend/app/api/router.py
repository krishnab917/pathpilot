from fastapi import APIRouter
from app.api.routes import careers, health, mentor, roadmaps, simulations

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(careers.router, prefix="/careers", tags=["careers"])
api_router.include_router(roadmaps.router, prefix="/roadmaps", tags=["roadmaps"])
api_router.include_router(simulations.router, prefix="/simulations", tags=["simulations"])
api_router.include_router(mentor.router, prefix="/mentor", tags=["mentor"])
