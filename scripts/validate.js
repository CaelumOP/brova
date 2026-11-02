// npm run validate: checks the config and every exam, prints each problem, exits 1 if any.
import { formatProblem, validateAll } from "./lib/validate-exams.js";

const { problems, checked } = await validateAll({ root: "." });
for (const p of problems) console.log(formatProblem(p));
console.log(`${checked} files checked, ${problems.length} problems`);
if (problems.length > 0) process.exitCode = 1;
