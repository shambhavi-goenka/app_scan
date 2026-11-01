import { writeFile } from "node:fs/promises";

const results = [];

export async function exportSecurityResults(filePath) {
  await writeFile(
    filePath,
    JSON.stringify(getSecurityResults(), null, 2),
    "utf8"
  );
}

export function recordSecurityResult({
  id,
  category,
  test,
  method = "N/A",
  endpoint = "N/A",
  input = "N/A",
  expectedStatus = null,
  actualStatus = null,
  expectedBehavior,
  actualBehavior,
  passed,
}) {
  results.push({
    id,
    category,
    test,
    method,
    endpoint,
    input,
    expectedStatus,
    actualStatus,
    expectedBehavior,
    actualBehavior,
    passed,
  });
}

export function getSecurityResults() {
  return [...results];
}
