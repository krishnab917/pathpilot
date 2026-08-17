import { refreshBnlHighSchoolResearchOpportunity } from "../server/db.ts";

const result = await refreshBnlHighSchoolResearchOpportunity();
console.log(JSON.stringify(result));
