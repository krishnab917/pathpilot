export type PlanningActivityExportRow = { activity: string; subject: string; recordedAt: Date };

const csvValue = (value: string) => `"${value.replaceAll('"', '""')}"`;

export function buildPlanningActivityCsv(rows: PlanningActivityExportRow[]) {
  return ["Activity,Subject,Recorded at", ...rows.map(row => [csvValue(row.activity), csvValue(row.subject), csvValue(row.recordedAt.toISOString())].join(","))].join("\n");
}
