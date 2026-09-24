// build:vercel bundles local TypeScript imports and aliases for native Node ESM.
// The /api/:path* rewrite preserves the incoming URL for Express routing.
import { createApp } from "../dist/vercel-api.mjs";

export default createApp();
