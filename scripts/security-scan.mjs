import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Findings contain categories and locations only, never matched values or lines.
export function secretCategories(text) {
  const categories = new Set();
  const patterns = [
    ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/],
    ["github-token", /\b(?:gh[pousr]_[A-Za-z0-9]{30,255}|github_pat_[A-Za-z0-9_]{60,255})\b/],
    ["ai-provider-key", /\bsk-(?:(?:proj|svcacct|ant-api\d+)-)?[A-Za-z0-9_-]{32,255}\b/],
    ["supabase-secret", /\bsb_secret_[A-Za-z0-9_-]{25,255}\b/],
    ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ["google-api-key", /\bAIza[0-9A-Za-z_-]{35}\b/],
    ["npm-token", /\bnpm_[A-Za-z0-9]{36,}\b/],
  ];
  for (const [category, pattern] of patterns) if (pattern.test(text)) categories.add(category);
  for (const match of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]{20,}\b/g)) {
    try { if (JSON.parse(Buffer.from(match[1], "base64url").toString()).role === "service_role") categories.add("service-role-jwt"); } catch { /* Not a JWT. */ }
  }
  for (const match of text.matchAll(/\b(?:postgres(?:ql)?|mysql):\/\/[^\s"'`]+/gi)) {
    try {
      const url = new URL(match[0]);
      if (url.password && !/^(?:password|test|example|placeholder|<.*>|\$.*)$/i.test(decodeURIComponent(url.password))) categories.add("database-password-url");
    } catch { /* Templates are not usable credentials. */ }
  }
  // Literal assignment checks supplement token patterns. Placeholder/examples remain valid.
  for (const match of text.matchAll(/\b(?:JWT_SECRET|[A-Z_]*(?:API_KEY|CLIENT_SECRET|REFRESH_TOKEN|WEBHOOK_SECRET|ACCESS_TOKEN|SECRET_ACCESS_KEY))\s*[:=]\s*["']([^"'\r\n]{20,})["']/g)) {
    if (!/example|placeholder|sentinel|fixture|test|your[-_ ]|\$\{|process\.env|import\.meta/i.test(match[1])) categories.add("literal-secret-assignment");
  }
  for (const match of text.matchAll(/^(?:export[ \t]+)?(?:JWT_SECRET|[A-Z_]*(?:API_KEY|CLIENT_SECRET|REFRESH_TOKEN|WEBHOOK_SECRET|ACCESS_TOKEN|SECRET_ACCESS_KEY))[ \t]*=[ \t]*([^\s#"']{20,})[ \t]*$/gm)) {
    if (!/example|placeholder|sentinel|fixture|test|your[-_ ]|\$\{|<|process\.env/i.test(match[1])) categories.add("literal-environment-secret");
  }
  return [...categories];
}

const git = args => execFileSync("git", args, { maxBuffer: 256 * 1024 * 1024 });
function scanBuffer(buffer, location, findings) {
  if (buffer.includes(0)) return;
  for (const category of secretCategories(buffer.toString("utf8"))) findings.push({ ...location, category });
}

export function runScan(history = false, built = false) {
  const findings = [];
  const files = git(["ls-files", "-z", "--cached", "--others", "--exclude-standard"]).toString().split("\0").filter(Boolean);
  for (const path of new Set(files)) if (existsSync(path)) scanBuffer(readFileSync(path), { path, scope: "worktree" }, findings);
  if (history) {
    const objects = git(["rev-list", "--objects", "--all"]).toString().trim().split("\n");
    const paths = new Map(objects.map(line => { const space = line.indexOf(" "); return [space < 0 ? line : line.slice(0, space), space < 0 ? "" : line.slice(space + 1)]; }));
    const input = [...paths.keys()].join("\n") + "\n";
    const metadata = execFileSync("git", ["cat-file", "--batch-check"], { input, maxBuffer: 64 * 1024 * 1024 }).toString();
    const blobs = metadata.trim().split("\n").filter(line => line.split(" ")[1] === "blob").map(line => line.split(" ")[0]);
    for (let start = 0; start < blobs.length; start += 100) {
      const batch = execFileSync("git", ["cat-file", "--batch"], { input: blobs.slice(start, start + 100).join("\n") + "\n", maxBuffer: 256 * 1024 * 1024 });
      let offset = 0;
      while (offset < batch.length) {
        const end = batch.indexOf(10, offset);
        const [oid, , size] = batch.subarray(offset, end).toString().split(" ");
        offset = end + 1;
        const before = findings.length;
        scanBuffer(batch.subarray(offset, offset + Number(size)), { path: paths.get(oid), scope: "history", object: oid }, findings);
        if (findings.length > before) {
          const commit = git(["log", "--all", `--find-object=${oid}`, "-1", "--format=%h"]).toString().trim();
          for (const finding of findings.slice(before)) finding.commit = commit;
        }
        offset += Number(size) + 1;
      }
    }
  }
  let builtFilesScanned = 0;
  function scanBuilt(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) scanBuilt(path);
      else if (entry.isFile()) { scanBuffer(readFileSync(path), { path, scope: "browser-build" }, findings); builtFilesScanned++; }
    }
  }
  if (built && existsSync("dist/public")) scanBuilt("dist/public");
  return { filesScanned: new Set(files).size, historyScanned: history, builtFilesScanned, findings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runScan(process.argv.includes("--history"), process.argv.includes("--built"));
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.findings.length ? 1 : 0;
}
