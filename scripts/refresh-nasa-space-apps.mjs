import { refreshNasaSpaceAppsOpportunity } from "../server/db.ts";

const record = await refreshNasaSpaceAppsOpportunity();
console.log(`Refreshed ${record.title} at ${record.verifiedAt.toISOString()}`);
