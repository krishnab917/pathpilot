// build:vercel bundles local TypeScript imports and aliases for native Node ESM.
// The API namespace rewrite preserves the incoming URL for Express routing.
import { createApp } from "../dist/vercel-api.mjs";

export default createApp();
