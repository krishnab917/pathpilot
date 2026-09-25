// Run after build:vercel with native Node, without tsx or a TypeScript loader.
// Imports the actual deployment entry; never sends credentials or writes data.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import app from "../api/index.js";

const server = createServer(app);
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  for (const [path, expectedStatus] of [
    ["/api/trpc/auth.me", 200],
    ["/api/trpc/pathpilot.dashboard.get?batch=1&input=" + encodeURIComponent(JSON.stringify({ 0: { json: null, meta: { values: ["undefined"] } } })), 401],
    ["/api/trpc/noSuchProcedure", 404],
    ["/api/missing", 404],
  ]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, expectedStatus, path);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/, path);
    await response.json();
    console.log(`${path.split("?")[0]} → ${response.status} → application/json`);
  }
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
