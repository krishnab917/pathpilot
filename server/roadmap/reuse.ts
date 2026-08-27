type Timestamped = { updatedAt: Date };

type ReusableRoadmap = Timestamped & {
  targetCareer: string;
};

export function canReuseActiveRoadmap({
  activeRoadmap,
  targetCareer,
  profileUpdatedAt,
  latestSimulationUpdatedAt,
  goals,
  projects,
}: {
  activeRoadmap: ReusableRoadmap | undefined;
  targetCareer: string;
  profileUpdatedAt: Date;
  latestSimulationUpdatedAt?: Date;
  goals: Timestamped[];
  projects: Timestamped[];
}) {
  if (!activeRoadmap) return false;
  if (activeRoadmap.targetCareer.trim().toLocaleLowerCase() !== targetCareer.trim().toLocaleLowerCase()) return false;

  const latestSourceChange = Math.max(
    profileUpdatedAt.getTime(),
    latestSimulationUpdatedAt?.getTime() ?? 0,
    ...goals.map(goal => goal.updatedAt.getTime()),
    ...projects.map(project => project.updatedAt.getTime())
  );
  return activeRoadmap.updatedAt.getTime() >= latestSourceChange;
}
