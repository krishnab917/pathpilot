import { OpportunityRecord } from "@/components/OpportunityRecord";
import { useId, useState } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Compass, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  filterOpportunityExamples,
  publicOpportunityDetails,
  previewCareers,
  type PreviewCategory,
} from "@/lib/landing-opportunities";

export function LandingOpportunitiesPreview({
  compact = false,
}: {
  compact?: boolean;
}) {
  const groupId = useId();
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PreviewCategory | "">("");
  const [alignedOnly, setAlignedOnly] = useState(true);
  const [career, setCareer] = useState<string>(previewCareers[0].name);
  const results = filterOpportunityExamples(
    search,
    category,
    alignedOnly,
    career
  );
  return (
    <LayoutGroup id={groupId}>
      <div
        className={
          "landing-product-window overflow-hidden " +
          (compact ? "" : "landing-catalog-window")
        }
      >
        <div className="landing-window-bar">
          <span className="flex items-center gap-2">
            <Compass aria-hidden="true" className="size-4" /> PathPilot{" "}
            <span className="text-muted-foreground">/ Opportunities</span>
          </span>
          <span className="landing-example-label">Public catalog sample</span>
        </div>
        <div className={compact ? "" : "landing-catalog-layout"}>
          <div
            className={
              compact
                ? "border-b border-border p-4"
                : "landing-catalog-filters p-5 sm:p-7"
            }
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-semibold tracking-tight">
                Find your next experience.
              </p>
              <Search
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
            </div>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              Real listings from PathPilot’s public sources, not live listings
              or personalized recommendations.
            </p>
            <label className="mt-5 block text-xs font-medium">
              Example career direction
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={career}
                onChange={event => setCareer(event.target.value)}
              >
                {previewCareers.map(item => (
                  <option key={item.name}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-xs font-medium">
              Search titles and summaries
              <Input
                className="mt-2"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Try NASA or research"
              />
            </label>
            <div
              className="landing-filter-tabs mt-4 flex flex-wrap gap-1"
              role="group"
              aria-label="Example opportunity categories"
            >
              {(
                [
                  ["", "All"],
                  ["research", "Research"],
                  ["competition", "Competitions"],
                  ["internship", "Internships"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant="ghost"
                  className="relative isolate rounded-md"
                  aria-pressed={category === value}
                  onClick={() => setCategory(value)}
                >
                  {category === value && (
                    <motion.span
                      layoutId="opportunity-filter"
                      className="absolute inset-0 -z-10 rounded-md bg-secondary"
                      transition={{ duration: reduceMotion ? 0 : 0.22 }}
                    />
                  )}
                  {label}
                </Button>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-primary"
                checked={alignedOnly}
                onChange={event => setAlignedOnly(event.target.checked)}
              />
              Align this sample to the selected career
            </label>
          </div>
          <div className="min-w-0">
            <p
              role="status"
              className="border-b border-border px-5 py-3 text-xs text-muted-foreground"
            >
              {results.length} public{" "}
              {results.length === 1 ? "listing" : "listings"} shown. Nothing
              here is saved.
            </p>
            <div
              className={
                compact
                  ? "landing-opportunity-results h-64 overflow-y-auto overscroll-y-contain divide-y divide-border focus-visible:outline-2 focus-visible:outline-primary"
                  : "landing-opportunity-results max-h-[38rem] overflow-y-auto overscroll-y-contain divide-y divide-border"
              }
              role="region"
              aria-label="Example opportunity results"
              tabIndex={0}
            >
              {results.map(item => (
                <motion.article
                  layout={reduceMotion ? false : "position"}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.22 }}
                  key={item.id}
                  className={
                    compact ? "pp-action-row px-4 py-3" : "pp-action-row p-5"
                  }
                >
                  <OpportunityRecord
                    headingLevel={3}
                    notice={item.recordNote}
                    opportunity={publicOpportunityDetails(item, alignedOnly ? [career] : [])}
                  />
                  <Button size="sm" variant="outline" className="mt-4" asChild>
                    <a
                      href={item.applicationUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source page{" "}
                      <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    </a>
                  </Button>
                </motion.article>
              ))}
              {!results.length && (
                <div className="p-5">
                  <p className="text-sm">
                    No listings in this small sample match. Try another filter
                    or open the full catalog in your workspace.
                  </p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setCategory("");
                      setAlignedOnly(true);
                      setCareer(previewCareers[0].name);
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        {!compact && (
          <p className="border-t border-border px-5 py-4 text-xs leading-6 text-muted-foreground">
            Your workspace also filters by organizer-published country, grade,
            and deadline. Career alignment uses saved directions, not a
            prediction of eligibility. This sample uses local keyword matching;
            the signed-in catalog uses database full-text search.
          </p>
        )}
      </div>
    </LayoutGroup>
  );
}
