// Ad-hoc verification: extract every initialQuery/solutionQuery/verifyQuery
// from the lesson files and run each against a FRESH seeded database to ensure
// they are valid SQL against the schema. Run: node scripts/verify-queries.mjs
import initSqlJs from "sql.js";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readFile(p) {
  return fs.readFileSync(path.join(root, p), "utf8");
}

// Extract the SEED_SQL template literal.
const seedSrc = readFile("src/lib/db/seed.ts");
const seedMatch = seedSrc.match(/SEED_SQL = \/\* sql \*\/ `([\s\S]*?)`;/);
if (!seedMatch) {
  console.error("Could not extract SEED_SQL");
  process.exit(1);
}
const SEED_SQL = seedMatch[1];

// Extract query string literals from lesson files.
const lessonFiles = [
  "src/lib/lessons/basic.ts",
  "src/lib/lessons/intermediate.ts",
  "src/lib/lessons/advanced.ts",
];
const queryRe = /\b(initialQuery|solutionQuery|verifyQuery)\s*:\s*("(?:[^"\\]|\\.)*")/g;

const queries = [];
for (const file of lessonFiles) {
  const src = readFile(file);
  let m;
  while ((m = queryRe.exec(src))) {
    const kind = m[1];
    const value = JSON.parse(m[2]); // unescape \n etc.
    queries.push({ file: path.basename(file), kind, value });
  }
}

const SQL = await initSqlJs({
  locateFile: (f) => path.join(root, "node_modules/sql.js/dist", f),
});

let pass = 0;
const failures = [];

for (const q of queries) {
  const db = new SQL.Database();
  try {
    db.run(SEED_SQL);
    db.exec(q.value);
    pass++;
  } catch (err) {
    failures.push({ ...q, error: err.message });
  } finally {
    db.close();
  }
}

console.log(`Total queries: ${queries.length}`);
console.log(`Passed:        ${pass}`);
console.log(`Failed:        ${failures.length}`);
if (failures.length) {
  console.log("\n--- FAILURES ---");
  for (const f of failures) {
    console.log(`[${f.file}] ${f.kind}: ${f.error}`);
    console.log(`  query: ${f.value.replace(/\n/g, " ")}`);
  }
  process.exit(1);
}
console.log("\nAll lesson queries executed successfully against the schema.");
