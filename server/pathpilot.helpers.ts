export type SimulationChoiceImpact = {
  technicalImpact: number;
  leadershipImpact: number;
  compatibilityImpact: number;
};

/** Validates the core discovery promise: five distinct, non-empty career names. */
export function hasExactlyFiveUniqueCareerMatches(matches: Array<{ name: string }>) {
  return matches.length === 5 && new Set(matches.map(match => match.name.trim().toLocaleLowerCase())).size === 5;
}

/** Averages scenario outcomes into the three fit dimensions shown to a student. */
export function calculateSimulationScores(choices: SimulationChoiceImpact[]) {
  if (!choices.length) throw new Error("At least one simulation choice is required.");
  const average = (values: number[]) => Math.round(values.reduce((total, value) => total + value, 0) / values.length);
  const technicalScore = average(choices.map(choice => choice.technicalImpact));
  const leadershipScore = average(choices.map(choice => choice.leadershipImpact));
  const careerCompatibilityScore = average(choices.map(choice => choice.compatibilityImpact));
  return { technicalScore, leadershipScore, careerCompatibilityScore, score: Math.round((technicalScore + leadershipScore + careerCompatibilityScore) / 3) };
}

export function buildSimulationFeedback(career: string, technical: number, leadership: number, compatibility: number) {
  const scoreLabel = (value: number) => value >= 80 ? "a clear strength" : value >= 60 ? "a promising base" : "an area to intentionally develop";
  const priorities: [string, number][] = [["technical depth", technical], ["leadership judgment", leadership], ["career alignment", compatibility]];
  const priority = priorities.sort((a, b) => a[1] - b[1])[0][0];
  return `### Career Fit Analysis — ${career}\n\nYour simulation shows ${scoreLabel(technical)} in technical judgment, ${scoreLabel(leadership)} in leadership, and ${scoreLabel(compatibility)} in career alignment. Focus next on **${priority}** by selecting one small real-world project or activity where you can practice this dimension and reflect on the result.`;
}
