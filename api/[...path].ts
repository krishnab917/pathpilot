import { createApp } from "../server/_core/app";

// File-system catch-all for /api/* requests on Vercel. Express receives the
// original API path, so its existing tRPC and scheduled-worker routes apply.
export default createApp();
