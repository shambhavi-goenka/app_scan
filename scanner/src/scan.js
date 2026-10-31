import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const API_URL = process.env.API_URL || "http://127.0.0.1:3001/api";

const findings = [];

async function request(path, options = {}, token = null) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  return {
    status: response.status,
    data,
  };
}

function recordFinding({
  id,
  title,
  severity,
  endpoint,
  status,
  vulnerable,
  evidence,
  remediation,
}) {
  findings.push({
    id,
    title,
    severity,
    endpoint,
    status,
    vulnerable,
    evidence,
    remediation,
  });
}

async function registerOrganization(name, email) {
  const result = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      organizationName: name,
      name,
      email,
      password: "ScannerTestPassword!123",
    }),
  });

  if (result.status !== 201 || !result.data.token) {
    throw new Error(
      `Could not register scanner account: ${JSON.stringify(result.data)}`
    );
  }

  return result.data.token;
}

async function createProject(token, name) {
  const result = await request(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description: "Created by the SecureSaaS security scanner",
      }),
    },
    token
  );

  if (![200, 201].includes(result.status)) {
    throw new Error(`Project creation failed: ${JSON.stringify(result.data)}`);
  }

  const listed = await request("/projects", {}, token);

  if (listed.status !== 200) {
    throw new Error("Could not retrieve scanner projects");
  }

  const projects = listed.data.projects ?? listed.data;
  const project = projects.find((item) => item.name === name);

  if (!project) {
    throw new Error("Created project was not found in the project list");
  }

  return project.id;
}

async function createDocument(token, projectId, title) {
  const result = await request(
    "/documents",
    {
      method: "POST",
      body: JSON.stringify({
        projectId,
        title,
        content: "Scanner-created test document",
      }),
    },
    token
  );

  if (![200, 201].includes(result.status)) {
    throw new Error(`Document creation failed: ${JSON.stringify(result.data)}`);
  }

  const listed = await request("/documents", {}, token);

  if (listed.status !== 200) {
    throw new Error("Could not retrieve scanner documents");
  }

  const documents = listed.data.documents ?? listed.data;
  const document = documents.find((item) => item.title === title);

  if (!document) {
    throw new Error("Created document was not found in the document list");
  }

  return document.id;
}

async function testProjectBOLA(aliceToken, bobProjectId) {
  const result = await request(
    `/projects/${bobProjectId}`,
    {},
    aliceToken
  );

  const vulnerable = result.status === 200;

  recordFinding({
    id: "BOLA-001",
    title: "Cross-tenant project access",
    severity: "High",
    endpoint: `GET /api/projects/${bobProjectId}`,
    status: result.status,
    vulnerable,
    evidence: vulnerable
      ? "Alice successfully retrieved a project belonging to Bob's organization."
      : `Cross-tenant request was rejected with HTTP ${result.status}.`,
    remediation:
      "Scope project lookups by both project ID and the authenticated user's organization ID.",
  });
}

async function testDocumentBOLA(aliceToken, bobDocumentId) {
  const result = await request(
    `/documents/${bobDocumentId}`,
    {},
    aliceToken
  );

  const vulnerable = result.status === 200;

  recordFinding({
    id: "BOLA-002",
    title: "Cross-tenant document access",
    severity: "High",
    endpoint: `GET /api/documents/${bobDocumentId}`,
    status: result.status,
    vulnerable,
    evidence: vulnerable
      ? "Alice successfully retrieved a document belonging to Bob's organization."
      : `Cross-tenant request was rejected with HTTP ${result.status}.`,
    remediation:
      "Scope document lookups by both document ID and the authenticated user's organization ID.",
  });
}

async function printReport() {
  const vulnerableFindings = findings.filter(
    (finding) => finding.vulnerable
  );

  const timestamp = new Date().toISOString();

  const report = {
    scanner: "SecureSaaS Application Security Scanner",
    target: API_URL,
    scannedAt: timestamp,
    checksPerformed: findings.length,
    vulnerabilitiesFound: vulnerableFindings.length,
    result: vulnerableFindings.length > 0 ? "VULNERABLE" : "PASS",
    findings,
  };

  const reportDirectory = resolve("reports");

  await mkdir(reportDirectory, { recursive: true });

  const filename = timestamp.replace(/[:.]/g, "-");

  const jsonPath = resolve(reportDirectory, `${filename}.json`);
  const markdownPath = resolve(reportDirectory, `${filename}.md`);

  await writeFile(
    jsonPath,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  const markdown = [
    "# SecureSaaS Security Scan Report",
    "",
    `- **Target:** ${API_URL}`,
    `- **Scanned at:** ${timestamp}`,
    `- **Checks performed:** ${findings.length}`,
    `- **Vulnerabilities found:** ${vulnerableFindings.length}`,
    `- **Overall result:** ${report.result}`,
    "",
    "## Findings",
    "",
    ...findings.flatMap((finding) => [
      `### ${finding.id} — ${finding.title}`,
      "",
      `- **Severity:** ${finding.severity}`,
      `- **Status:** ${finding.vulnerable ? "VULNERABLE" : "PASS"}`,
      `- **Endpoint:** ${finding.endpoint}`,
      `- **HTTP status:** ${finding.status}`,
      `- **Evidence:** ${finding.evidence}`,
      `- **Remediation:** ${finding.remediation}`,
      "",
    ]),
    "## Scope and limitations",
    "",
    "This scan tests the listed cross-tenant authorization scenarios only.",
    "A passing result does not establish that the entire application is secure.",
    "",
  ].join("\n");

  await writeFile(markdownPath, markdown, "utf8");

  console.log("\n======================================");
  console.log(" SecureSaaS Application Security Scan");
  console.log("======================================");
  console.log(`Target: ${API_URL}`);
  console.log(`Checks performed: ${findings.length}`);
  console.log(`Vulnerabilities found: ${vulnerableFindings.length}`);
  console.log(`Result: ${report.result}`);
  console.log("--------------------------------------");

  for (const finding of findings) {
    console.log(
      `\n[${finding.vulnerable ? "VULNERABLE" : "PASS"}] ${finding.id}`
    );
    console.log(`Title: ${finding.title}`);
    console.log(`Severity: ${finding.severity}`);
    console.log(`Endpoint: ${finding.endpoint}`);
    console.log(`HTTP status: ${finding.status}`);
    console.log(`Evidence: ${finding.evidence}`);
    console.log(`Remediation: ${finding.remediation}`);
  }

  console.log("\nReports generated:");
  console.log(`JSON: ${jsonPath}`);
  console.log(`Markdown: ${markdownPath}`);
}

async function main() {
  console.log(`Starting scan against ${API_URL}`);

  const health = await request("/health");

  if (health.status !== 200) {
    throw new Error(
      `Target health check failed. HTTP status: ${health.status}`
    );
  }

  const unique = randomUUID().slice(0, 8);

  console.log("Creating two test organizations...");

  const aliceToken = await registerOrganization(
    `Scanner Alice ${unique}`,
    `scanner-alice-${unique}@example.test`
  );

  const bobToken = await registerOrganization(
    `Scanner Bob ${unique}`,
    `scanner-bob-${unique}@example.test`
  );

  console.log("Creating test projects and documents...");

  const aliceProjectId = await createProject(
    aliceToken,
    `Scanner Alice Project ${unique}`
  );

  const bobProjectId = await createProject(
    bobToken,
    `Scanner Bob Project ${unique}`
  );

  const bobDocumentId = await createDocument(
    bobToken,
    bobProjectId,
    `Scanner Bob Document ${unique}`
  );

  // Confirm Alice's own resource is accessible before testing isolation.
  const ownProject = await request(
    `/projects/${aliceProjectId}`,
    {},
    aliceToken
  );

  if (ownProject.status !== 200) {
    throw new Error("Control check failed: Alice cannot access her own project");
  }

  console.log("Testing cross-tenant authorization...");

  await testProjectBOLA(aliceToken, bobProjectId);
  await testDocumentBOLA(aliceToken, bobDocumentId);

  await printReport();
}

main().catch((error) => {
  console.error("\nScanner failed:", error.message);
  process.exitCode = 1;
});