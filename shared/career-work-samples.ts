import { reviewWork, type WorkTask, type WorkSubmission, type WorkReceipt } from "./simulation-work";
import { type CareerField, type Dimension } from "./career-taxonomy";
import { MAPPING_VERSION, type BehavioralSignal } from "./career-matching";

type Row = [string, string, string];
function task(title: string, instruction: string, evidence: string, kind: WorkTask["kind"], rows: Row[], options?: string[], budget?: number): WorkTask {
  return { title, instruction, kind, budget, unit: "units", learning: rows.map(row => row[2]).join(" "),
    evidence: [{ id: "brief", title: "Assignment evidence", content: evidence }],
    fields: rows.map(([label, expected, explanation], index) => ({ id: `f${index}`, label, expected, explanation, options: kind === "sequence" ? rows.map((_, i) => String(i + 1)) : options })) };
}
type Sample = { title: string; boundary: string; dimensions: Dimension[]; tasks: [WorkTask, WorkTask] };
const sequence = (title: string, evidence: string, steps: string[]) => task(title, "Arrange the workflow using the dependencies in the evidence.", evidence, "sequence", steps.map((step, i) => [step, String(i + 1), `Step ${i + 1}: ${step}.`]));
const calculation = (title: string, evidence: string, rows: Row[]) => task(title, "Complete the calculation sheet using only the supplied fictional data. Enter numbers without units.", evidence, "calculate", rows);
const classify = (title: string, evidence: string, rows: Row[], options: string[]) => task(title, "Annotate each item against the evidence. You can revise after checking.", evidence, "classify", rows, options);

/** Shared field exercises: never advertised as 108 bespoke career simulations. */
export const fieldWorkSamples: Record<CareerField, Sample> = {
  technology: { title: "Investigate a failed import", boundary: "A simplified technical investigation, not a coding qualification.", dimensions: ["investigation", "adaptation"], tasks: [
    classify("Build an incident ledger", "Log: file A has headers and loads; B has no headers and fails. A report says the network caused both failures, but no network trace is provided.", [["B is missing headers", "Observed", "The log supplies direct evidence."], ["Network caused the failure", "Unconfirmed", "The proposed cause is unsupported."]], ["Observed", "Unconfirmed"]),
    sequence("The fix fails on empty files", "New evidence: adding headers fixed B, but an empty file still crashes. First reproduce the empty-file failure, then add a guard, then run both regression tests.", ["Reproduce empty input", "Add empty-input handling", "Run missing-header and empty-file tests"]),
  ] },
  healthcare: { title: "Prepare an accurate care handoff", boundary: "Record organization only. No clinical diagnosis or treatment advice.", dimensions: ["communication", "constraints"], tasks: [
    classify("Check record readiness", "Fictional record A has an ID and observation time. Record B has an ID but no time. A note says a patient needs a new medicine without an authorized instruction.", [["Record A", "Ready to pass on", "Identifiers and time are present."], ["Record B", "Clarify first", "The time is needed to interpret the observation."], ["Medicine note", "Clarify first", "Do not turn an unsupported note into treatment."]], ["Ready to pass on", "Clarify first"]),
    sequence("Two records have similar names", "A colleague reports a possible mix-up. Pause the handoff, verify identifiers with the responsible professional, then send the corrected record with the uncertainty documented.", ["Pause the handoff", "Verify identifiers with responsible professional", "Document correction and hand over"]),
  ] },
  business: { title: "Plan a small service budget", boundary: "Fictional operating arithmetic, not investment advice.", dimensions: ["constraints", "planning"], tasks: [
    calculation("Estimate the event surplus", "40 tickets at 8 units each; venue 100 units; materials 3 units per attendee.", [["Revenue", "320", "40 × 8 = 320."], ["Materials", "120", "40 × 3 = 120."], ["Surplus", "100", "320 − 100 − 120 = 100."]]),
    calculation("Attendance falls", "New forecast: only 25 tickets sell. Ticket price, venue cost and materials per person are unchanged.", [["Revised revenue", "200", "25 × 8 = 200."], ["Revised materials", "75", "25 × 3 = 75."], ["Revised surplus", "25", "The plan remains positive but has less margin."]]),
  ] },
  creative: { title: "Revise an event poster", boundary: "A communication design exercise shared across creative fields, not a talent test.", dimensions: ["creative", "communication"], tasks: [
    sequence("Arrange the information hierarchy", "Readers first need to identify the event, then decide whether the date and location work, then find the registration action.", ["Event name", "Date and location", "Registration instruction"]),
    classify("A reader cannot use the preview", "New feedback: the date is embedded only in an image; the action says 'here'; pale text disappears on a phone. Match each issue to an actionable revision.", [["Image-only date", "Add readable text", "Important information must remain available as text."], ["Action says here", "Name the destination", "Describe what the link opens."], ["Pale text", "Increase contrast", "Readability matters at small sizes."]], ["Add readable text", "Name the destination", "Increase contrast"]),
  ] },
  hospitality: { title: "Scale a kitchen production plan", boundary: "Recipe arithmetic and planning; not food-safety certification or cooking supervision.", dimensions: ["practical", "constraints"], tasks: [
    calculation("Prepare the batch sheet", "A fictional recipe for 4 servings uses 200g flour, 100g fruit and 40g oil. Plan 12 servings.", [["Flour in grams", "600", "Three batches require 600g."], ["Fruit in grams", "300", "Three batches require 300g."], ["Oil in grams", "120", "Three batches require 120g."]]),
    calculation("Stock limits the menu", "New constraint: only 200g fruit is available. Keep the recipe proportions unchanged. Each 4-serving batch still uses 100g fruit, 200g flour and 40g oil.", [["Servings possible", "8", "The fruit supports two batches."], ["Flour in grams", "400", "Two batches use 400g."], ["Oil in grams", "80", "Adjust the whole recipe, not just the scarce ingredient."]]),
  ] },
  trades: { title: "Inspect a fabrication batch", boundary: "Drawing and measurement review only; no powered tools or safety-critical repairs.", dimensions: ["practical", "investigation"], tasks: [
    classify("Mark the inspection sheet", "Drawing requires lengths from 99 to 101mm inclusive. Measured pieces: A 100mm, B 102mm, C 99mm.", [["Piece A", "Within tolerance", "100 is in the stated interval."], ["Piece B", "Needs review", "102 exceeds the upper bound."], ["Piece C", "Within tolerance", "The lower bound is inclusive."]], ["Within tolerance", "Needs review"]),
    sequence("The measuring tool is suspect", "New evidence: the gauge may be offset. Hold the batch first, compare the gauge with a reference, then remeasure all pieces before release.", ["Hold the batch", "Check gauge against reference", "Remeasure and record results"]),
  ] },
  education: { title: "Use student work to plan a lesson", boundary: "Fictional work samples; no conclusions about a real student's ability.", dimensions: ["communication", "adaptation"], tasks: [
    classify("Sort the exit tickets", "A writes 1/2 + 1/4 = 2/6. B writes 3/4. C leaves it blank. A blank does not explain why a response is missing.", [["Ticket A", "Review common denominators", "A specific written error supports this next step."], ["Ticket B", "Try an extension", "This answer meets the current check."], ["Ticket C", "Ask what happened", "Do not diagnose from a blank response."]], ["Review common denominators", "Try an extension", "Ask what happened"]),
    task("The session is shortened", "Allocate exactly the stated plan: 4 units modeling, 3 practice, 2 checking, 1 questions.", "New constraint: 10 minutes total. Preserve student practice and a check for understanding.", "allocate", [["Model", "4", "Target the observed misconception."], ["Practice", "3", "Students need to attempt the method."], ["Check", "2", "Collect evidence of understanding."], ["Questions", "1", "Leave room for uncertainty."]], undefined, 10),
  ] },
  "public-service": { title: "Compare a community proposal", boundary: "A fictional public-planning exercise, not legal advice.", dimensions: ["constraints", "communication"], tasks: [
    classify("Prepare the evidence brief", "Published budget assigns 50 units to access improvements. A resident suggests benches. An unsigned post says the funding was canceled; no decision record is supplied.", [["50-unit budget", "Documented", "The published budget is evidence."], ["Benches suggestion", "Preference", "A proposal is a preference, not a public decision."], ["Canceled funding", "Unverified", "Seek the decision record before repeating the claim."]], ["Documented", "Preference", "Unverified"]),
    task("Access work becomes urgent", "Reserve 30 units for the required ramp, 15 for signage and 5 for consultation. Stay within 50 units.", "New site review: the ramp is required before the proposal can proceed. Benches must wait in this fictional plan.", "allocate", [["Ramp", "30", "Meet the access constraint."], ["Signage", "15", "Help people navigate."], ["Consultation", "5", "Preserve a route for public input."], ["Benches", "0", "Record the deferred request rather than promising unfunded work."]], undefined, 50),
  ] },
  "human-services": { title: "Build a consent-based support plan", boundary: "Resource navigation only; not counseling, diagnosis or a crisis-service simulation.", dimensions: ["service", "communication"], tasks: [
    classify("Record what is actually known", "A fictional client says travel is difficult and asks for online options. The worker guesses the client is unmotivated. The client has not agreed to share records.", [["Online option request", "Stated preference", "Use what the person actually requested."], ["Unmotivated label", "Unsupported inference", "A barrier is not a personality conclusion."], ["Permission to share", "Not established", "Ask before sharing private information."]], ["Stated preference", "Unsupported inference", "Not established"]),
    sequence("The preferred service has a waitlist", "Explain the waitlist, ask whether the client wants alternatives, then share only an agreed referral. Do not silently enroll them elsewhere.", ["Explain the waitlist", "Ask about acceptable alternatives", "Make only the agreed referral"]),
  ] },
  environment: { title: "Review a field survey", boundary: "Fictional observations; no hazardous sampling or attribution of real pollution.", dimensions: ["investigation", "practical"], tasks: [
    classify("Annotate water records", "A: location, time and calibration recorded. B: location missing. Blank control reads 6 units although near zero is expected.", [["Sample A", "Usable record", "Metadata supports interpretation."], ["Sample B", "Missing context", "Do not infer the location."], ["Blank control", "Quality concern", "Check contamination before drawing conclusions."]], ["Usable record", "Missing context", "Quality concern"]),
    sequence("Rain changes the comparison", "Rain occurred between samples. First resolve calibration and blank concerns, then collect comparable samples with weather notes, then report uncertainty.", ["Check calibration and blanks", "Collect comparable observations", "Report findings and uncertainty"]),
  ] },
  transport: { title: "Replan a delivery route", boundary: "Fictional scheduling, not vehicle operation or dispatch certification.", dimensions: ["planning", "constraints"], tasks: [
    calculation("Build the loading sheet", "Route has 3 stops requiring 8, 6 and 4 crates. Vehicle capacity is 20 crates.", [["Total crates", "18", "8 + 6 + 4 = 18."], ["Spare capacity", "2", "20 − 18 = 2."]]),
    calculation("The first stop adds demand", "The first stop now needs 12 crates, with other stops still needing 6 and 4. Capacity remains 20; do not overload.", [["New total", "22", "The new request exceeds capacity."], ["Crates needing another trip", "2", "At least two crates require another arrangement."]]),
  ] },
  sport: { title: "Plan an inclusive recreation session", boundary: "Fictional session planning; not exercise prescription or coaching certification.", dimensions: ["service", "planning"], tasks: [
    task("Allocate the session", "Use the agreed plan: 5 units welcome, 10 demonstration, 20 practice, 5 reflection.", "40 minutes total. Participants need clear instructions, practice and a chance to reflect.", "allocate", [["Welcome", "5", "Explain the activity and access options."], ["Demonstration", "10", "Make instructions clear."], ["Practice", "20", "Leave most time for participation."], ["Reflection", "5", "Invite feedback rather than inferring enjoyment."]], undefined, 40),
    sequence("The outdoor space closes", "Weather closes the planned venue. Check a safe accessible indoor alternative, ask participants about the adapted activity, then revise the plan and explain changes.", ["Check safe accessible space", "Ask about the adapted activity", "Revise and explain the plan"]),
  ] },
};

export type SampleRun = { version: "field-sample-v2.0"; field: CareerField; receipts: WorkReceipt[]; complete: boolean };
export const startSample = (field: CareerField): SampleRun => ({ version: "field-sample-v2.0", field, receipts: [], complete: false });
export function advanceSample(run: SampleRun, submission: WorkSubmission): SampleRun {
  if (run.complete || submission.nodeId !== `${run.field}-${run.receipts.length}`) throw new Error("This sample stage is no longer active.");
  const work = fieldWorkSamples[run.field].tasks[run.receipts.length];
  if (!work) throw new Error("Sample stage unavailable.");
  const receipt = reviewWork(work, submission);
  return { ...run, receipts: [...run.receipts, receipt], complete: run.receipts.length === 1 };
}
export function sampleSignals(run: SampleRun): BehavioralSignal[] {
  if (!run.complete) return [];
  return run.receipts.flatMap((receipt, stage) => {
    const observations: { dimension: Dimension; evidence: string }[] = [];
    if (receipt.tests) observations.push({ dimension: "investigation", evidence: `Checked the ${run.field} artifact before submission at stage ${stage + 1}. This does not establish that the check was understood.` });
    if (receipt.revised) observations.push({ dimension: "adaptation", evidence: `Revised the ${run.field} artifact after a check at stage ${stage + 1}.` });
    return observations.map(item => ({ version: MAPPING_VERSION, id: `sample:${run.field}:${stage}:${item.dimension}`, context: `field:${run.field}`, source: "observed", value: 0.65, conflicting: false, ...item }));
  });
}
