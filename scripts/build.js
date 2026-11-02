// npm run build: validates, then writes the site to _site/. Exits 1 on any problem.
import { buildSite } from "./lib/build-site.js";
import { formatProblem } from "./lib/validate-exams.js";

const sha = process.env.GITHUB_SHA;
const stamp = sha ? sha.slice(0, 7) : `local-${Date.now()}`;
const { exams, problems } = await buildSite({ root: ".", outDir: "_site", stamp });
if (problems.length > 0) {
  for (const p of problems) console.log(formatProblem(p));
  console.log(`${problems.length} problems; nothing was built`);
  process.exitCode = 1;
} else {
  console.log(`Built _site/ with ${exams} exams (stamp ${stamp})`);
}
