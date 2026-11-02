// Validates `root`, then writes the site to `outDir`: the manifest, the copied files,
// and the build stamp. Returns problems instead of printing or exiting.
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateAll } from "./validate-exams.js";

const COPY = ["index.html", "exam.html", "favicon.svg", "favicon.png", "css", "js", "fonts", "data/exams"];

export function contentHash(questions) {
  return createHash("sha256").update(JSON.stringify(questions)).digest("hex").slice(0, 8);
}

function buildManifest(config, exams) {
  const position = (list, key) => new Map(list.map((item, i) => [item[key], i]));
  const semesterOrder = position(config.semesters, "id");
  const courseOrder = position(config.courses, "code");
  const entries = exams.map(({ id, data }) => ({
    id,
    title: data.title,
    course: data.course,
    semester: data.semester,
    description: data.description,
    date: data.date,
    questionCount: data.questions.length,
    topics: [...new Set(data.questions.map((q) => q.topic))],
    hash: contentHash(data.questions),
  }));
  entries.sort(
    (a, b) =>
      semesterOrder.get(a.semester) - semesterOrder.get(b.semester) ||
      courseOrder.get(a.course) - courseOrder.get(b.course) ||
      (a.date < b.date ? 1 : a.date > b.date ? -1 : 0) ||
      a.title.localeCompare(b.title, "en"),
  );
  return { semesters: config.semesters, courses: config.courses, exams: entries };
}

async function stampFiles(dir, stamp) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await stampFiles(full, stamp);
    else if (/\.(html|js)$/.test(entry.name)) {
      const text = await readFile(full, "utf8");
      if (text.includes("__BUILD__")) await writeFile(full, text.replaceAll("__BUILD__", stamp));
    }
  }
}

export async function buildSite({ root, outDir, stamp }) {
  const { problems, config, exams } = await validateAll({ root });
  if (problems.length > 0) return { exams: 0, problems };

  await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, "data"), { recursive: true });
  for (const item of COPY) {
    try {
      await cp(path.join(root, item), path.join(outDir, item), {
        recursive: true,
        filter: (src) => !path.basename(src).startsWith("."),
      });
    } catch (error) {
      if (error.code === "ENOENT") throw new Error(`build: ${item} is missing from ${root}`);
      throw error;
    }
  }
  const manifest = buildManifest(config, exams);
  await writeFile(path.join(outDir, "data", "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await stampFiles(outDir, stamp);
  return { exams: exams.length, problems: [] };
}
