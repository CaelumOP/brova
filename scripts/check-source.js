// npm run check: prints each source-rule problem and exits 1 if there are any.
import { checkSource } from "./lib/check-source.js";

const problems = await checkSource({ root: "." });
for (const p of problems) console.log(`${p.file}:${p.line}: ${p.rule}: ${p.text}`);
console.log(`${problems.length} source problems`);
if (problems.length > 0) process.exitCode = 1;
