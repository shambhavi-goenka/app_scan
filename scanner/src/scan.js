import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile, } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scannerDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const projectRoot = path.resolve(scannerDir, "..");
const testsDir = path.join(projectRoot, "tests");
const reportsDir = path.join(scannerDir, "reports");

const targets = {
  vulnerable: {
    port: 3001,
    appMode: "vulnerable",
  },
  secure: {
    port: 3002,
    appMode: "secure",
  },
};

function getTarget() {
  const index = process.argv.indexOf("--target");
  const target = index === -1 ? "both" : process.argv[index + 1];

  if (!["vulnerable", "secure", "both"].includes(target)) {
    throw new Error(
      "Invalid target. Use --target vulnerable, --target secure, or --target both."
    );
  }

  return target;
}

function runSecurityTests(target, testFile, resultsFile) {
  const config = targets[target];

  const testPath = path.join(testsDir, "security", testFile);

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--test", testPath],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          APP_MODE: config.appMode,
          API_URL: `http://127.0.0.1:${config.port}/api`,
          SECURITY_REPORT_FILE: resultsFile,
          ...(target === "vulnerable"
          ? { JWT_SECRET: "secret123" }
          : {}),
        },
        stdio: "inherit",
      }
    );

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${testFile} failed for ${target} with exit code ${code}`));
        // console.log( `${testFile}: security test failures detected (exit code ${code}).` );
      } 
      else {
        resolve();
        // resolve(code);
      }
    });
  });
}

function createMarkdownReport(target, results) {
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  const rows = results.map((result) => {
    const status = (value) =>
      value === null || value === undefined ? "N/A" : value;

    return `| ${result.id} | ${result.test} | ${result.expectedBehavior} | ${result.method} ${result.endpoint} | ${result.input} | ${status(result.expectedStatus)} | ${status(result.actualStatus)} | ${result.passed ? "PASS" : "FAIL"} |`;
  });

  return `# ${target} Security Scan Report

## Summary

- **Target:** ${target}
- **Tests recorded:** ${results.length}
- **Passed:** ${passed}
- **Failed:** ${failed}

## Test Results

| ID | Test | Description | Request | Input | Expected HTTP | Actual HTTP | Result |
|---|---|---|---|---|---:|---:|---|
${rows.join("\n")}

## Detailed Results

${results
  .map(
    (result) => `### ${result.id} — ${result.test}

- **Category:** ${result.category}
- **Input:** ${result.input}
- **Expected behavior:** ${result.expectedBehavior}
- **Actual behavior:** ${result.actualBehavior}
- **Expected HTTP status:** ${result.expectedStatus ?? "N/A"}
- **Actual HTTP status:** ${result.actualStatus ?? "N/A"}
- **Result:** ${result.passed ? "PASS" : "FAIL"}`
  )
  .join("\n\n")}
`;
}


async function scanTarget(target) {
  console.log(`\nStarting ${target} security scan...`);

  const temporaryDir = await mkdtemp(
    path.join(os.tmpdir(), `app-scan-${target}-`)
  );

  try {
    const testFiles = [
      "bola.test.js",
      "least-privilege.test.js",
      "error-handling.test.js",
      "password-security.test.js",
      "input-validation.test.js",
      "authentication.test.js"
    ];

    for (const testFile of testFiles) {
      const resultsFile = path.join(
        temporaryDir,
        `${testFile.replace(".test.js", "")}-results.json`
      );

      console.log(`\nRunning ${testFile}...`);

      await runSecurityTests(target, testFile, resultsFile);
    }

    const resultFiles = await readdir(temporaryDir);
    const results = [];

    for (const file of resultFiles) {
      if (file.endsWith("-results.json")) {
        const rawResults = await readFile(
          path.join(temporaryDir, file),
          "utf8"
        );

        results.push(...JSON.parse(rawResults));
      }
    }

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error(`${target} scan produced no security results.`);
    }

    await writeFile(
      path.join(reportsDir, `${target}-report.md`),
      createMarkdownReport(target, results),
      "utf8"
    );

    const passed = results.filter((result) => result.passed).length;
    const failed = results.length - passed;

    console.log(
      `\n${target} report generated: scanner/reports/${target}-report.md`
    );
    console.log(`Total: ${results.length} | PASS: ${passed} | FAIL: ${failed}`);
  } finally {
    await rm(temporaryDir, { recursive: true, force: true });
  }
}


async function main() {
  const target = getTarget();

  await import("node:fs/promises").then(({ mkdir }) =>
    mkdir(reportsDir, { recursive: true })
  );

  const selectedTargets =
    target === "both" ? ["vulnerable", "secure"] : [target];

  for (const selectedTarget of selectedTargets) {
    await scanTarget(selectedTarget);
  }

  console.log("\nSecurity scan completed.");
}

main().catch((error) => {
  console.error("\nSecurity scan failed:", error.message);
  process.exitCode = 1;
});
