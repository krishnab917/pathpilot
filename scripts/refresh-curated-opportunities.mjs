import { refreshCuratedOpportunityCatalog } from "../server/db.ts";

const result = await refreshCuratedOpportunityCatalog();
console.log(JSON.stringify(result));
