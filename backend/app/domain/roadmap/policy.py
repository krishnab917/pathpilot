from app.models.schemas import RoadmapMilestone

class RoadmapPolicy:
    """Validates roadmap composition independently of generation, API, and persistence."""
    REQUIRED_CATEGORIES = {"skill", "project", "experience"}
    def validate(self, milestones: list[RoadmapMilestone]) -> None:
        if len(milestones) != 9:
            raise ValueError("A PathPilot roadmap must contain exactly nine milestones.")
        for year in range(1, 4):
            categories = {item.category for item in milestones if item.year == year}
            if categories != self.REQUIRED_CATEGORIES:
                raise ValueError(f"Year {year} must include one skill, project, and experience milestone.")
