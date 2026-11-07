import { CalendarDays, MapPin } from "lucide-react";
import { safeHttpUrl } from "@shared/safe-url";

export type OpportunityRecordDetails = {
  title: string;
  summary: string;
  category: string;
  participationMode: string;
  alignedCareers: string[];
  savedStatus: "saved" | "dismissed" | null;
  startAt: Date | null;
  endAt: Date | null;
  sourceDateLabel: string | null;
  locationLabel: string;
  eligibleGrades: string[];
  countryCodes: string[];
  applicationDeadlineAt: Date | null;
  registrationOpensAt: Date | null;
  relevanceReasons: string[];
  eligibilitySummary: string;
  sourceUrl: string;
  sourceName: string;
  verifiedAt?: Date;
};
const dateLabel = (value: Date | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not listed";
const dateRange = (
  start: Date | null,
  end: Date | null,
  label: string | null
) =>
  label ??
  (start && end
    ? `${dateLabel(start)} – ${dateLabel(end)}`
    : "Dates on source page");

/** Read-only record presentation shared by the signed-in catalog and public sample. */
export function OpportunityRecord({
  opportunity,
  notice,
  headingLevel = 2,
}: {
  opportunity: OpportunityRecordDetails;
  notice?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const deadlineIsPast = Boolean(
    opportunity.applicationDeadlineAt &&
      opportunity.applicationDeadlineAt.getTime() < Date.now()
  );
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-2">
        <span className="status-tag">{opportunity.category}</span>
        <span className="status-tag">
          {opportunity.participationMode.replaceAll("_", " ")}
        </span>
        {opportunity.alignedCareers.length > 0 && (
          <span className="status-tag">
            Aligned to {opportunity.alignedCareers.slice(0, 2).join(" · ")}
          </span>
        )}
        {opportunity.savedStatus === "saved" && (
          <span className="status-tag">Saved</span>
        )}
      </div>
      <Heading className="mt-3 text-lg font-medium leading-snug tracking-[-0.015em]">
        {opportunity.title}
      </Heading>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        {opportunity.summary}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {dateRange(
            opportunity.startAt,
            opportunity.endAt,
            opportunity.sourceDateLabel
          )}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {opportunity.locationLabel}
        </span>
        {opportunity.eligibleGrades.length > 0 && (
          <span>Published grades: {opportunity.eligibleGrades.join(", ")}</span>
        )}
        {opportunity.countryCodes.length > 0 && (
          <span>
            Published countries: {opportunity.countryCodes.join(", ")}
          </span>
        )}
      </div>
      {notice && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{notice}</p>
      )}
      {opportunity.applicationDeadlineAt && (
        <p className="mt-3 text-xs text-muted-foreground">
          {deadlineIsPast
            ? "Organizer-published deadline (past):"
            : "Organizer-published application deadline:"}{" "}
          <span className="data-value">
            {dateLabel(opportunity.applicationDeadlineAt)}
          </span>
          . Confirm current status with the organizer before acting.
        </p>
      )}
      {opportunity.registrationOpensAt && (
        <p className="mt-3 text-xs text-muted-foreground">
          Registration is listed to open on{" "}
          <span className="data-value">
            {dateLabel(opportunity.registrationOpensAt)}
          </span>
          ; verify the current status with the organizer.
        </p>
      )}
      {opportunity.relevanceReasons.length > 0 && (
        <details className="mt-3 border-l-2 border-primary/50 pl-3">
          <summary className="cursor-pointer text-xs font-medium text-primary">
            Why this may fit your saved information
          </summary>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
            {opportunity.relevanceReasons.map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </details>
      )}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-primary">
          Source and eligibility details
        </summary>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">
          {opportunity.eligibilitySummary}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Listed by{" "}
          <a
            className="utility-link"
            href={safeHttpUrl(opportunity.sourceUrl)}
            target="_blank"
            rel="noreferrer"
          >
            {opportunity.sourceName}
          </a>
          {opportunity.verifiedAt
            ? `; checked on ${dateLabel(opportunity.verifiedAt)}.`
            : "."}
        </p>
      </details>
    </div>
  );
}
