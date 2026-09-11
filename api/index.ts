import { createApp } from "../server/_core/app";

// Vercel invokes this Express application as a Node.js serverless function.
// Routing for its API and storage-compatibility paths is defined in vercel.json.
export default createApp();
