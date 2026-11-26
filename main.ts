// Entry program for make.fun bounty post-x-promote-make-your-own-bounty-01:
// copy POST.json from the repository root to /output/POST.json, where the
// gate reads it. That is all the program has to do. The entry is the post
// itself: one post of our own on X quoting make.fun's make-your-own-bounty
// post (https://x.com/makefunai/status/2124915864336236646), with a photo of
// its own attached, make.fun and the play code in its text; POST.json names
// the post, and the house reads its replies, reposts and quotes from X.
// The copy is verified: output bytes and SHA-256 must match the source,
// otherwise the program fails loudly instead of handing in a corrupt copy.
// Standard library only, no network, deterministic: the same POST.json always
// produces the same output bytes. Run: node main.ts (Node 22+).
// Set MAKEFUN_OUTPUT_DIR to choose a different output folder.
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const src = join(root, "POST.json");
const dest = join(outDir, "POST.json");

function sha256File(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

if (!existsSync(src)) {
  throw new Error(
    `POST.json not found: ${src} — ` +
      `POST.json must sit next to main.ts in the checked-out entry.`,
  );
}
const srcStat = statSync(src);
if (!srcStat.isFile()) {
  throw new Error(`POST.json is not a regular file: ${src}`);
}
const srcSize = srcStat.size;
if (srcSize === 0) {
  throw new Error(`POST.json is empty (0 bytes)`);
}
const srcHash = await sha256File(src);

mkdirSync(outDir, { recursive: true });
copyFileSync(src, dest);

const destSize = statSync(dest).size;
const destHash = await sha256File(dest);
if (destSize !== srcSize || destHash !== srcHash) {
  throw new Error(
    `output verification failed: ${dest} does not match ${src} ` +
      `(source ${srcSize} bytes sha256 ${srcHash}, ` +
      `output ${destSize} bytes sha256 ${destHash}) — copy was incomplete or corrupted.`,
  );
}
console.log(`wrote ${dest} (${destSize} bytes, sha256 ${destHash})`);
