import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { apiRequest, isSecure } from "./config.js";
import { recordSecurityResult, exportSecurityResults } from "./reporting.js";

let aliceToken;
let bobToken;
let aliceProjectId;
let bobProjectId;
let aliceDocumentId;
let bobDocumentId;

const unique = randomUUID().slice(0, 8);

function recordBolaResult({ id, test, method, endpoint, input, expectedStatus, actualStatus, expectedBehavior, actualBehavior, }) {
  recordSecurityResult({ id, category: "BOLA", test, method, endpoint, input, expectedStatus, actualStatus, expectedBehavior, actualBehavior, passed: actualStatus === expectedStatus, });
}

async function registerOrganization(organizationName, name, email) {
  const response = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      organizationName,
      name,
      email,
      password: "TestPassword!123",
    }),
  });

  assert.equal(
    response.status,
    201,
    `Registration failed: ${JSON.stringify(response.data)}`
  );

  assert.ok(response.data.token, "Registration did not return a token");

  return response.data.token;
}

async function createProject(token, name) {
  const created = await apiRequest(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description: "Automated security test project",
      }),
    },
    token
  );

  assert.equal(
    created.status,
    201,
    `Project creation failed: ${JSON.stringify(created.data)}`
  );

  const listed = await apiRequest("/projects", {}, token);

  assert.equal(listed.status, 200);

  const projects = listed.data.projects ?? listed.data;
  const project = projects.find((item) => item.name === name);

  assert.ok(project, `Could not find created project: ${name}`);

  return project.id;
}

async function createDocument(token, projectId, title) {
  const created = await apiRequest(
    "/documents",
    {
      method: "POST",
      body: JSON.stringify({
        projectId,
        title,
        content: "Automated security test document",
      }),
    },
    token
  );

  assert.equal(
    created.status,
    201,
    `Document creation failed: ${JSON.stringify(created.data)}`
  );

  const listed = await apiRequest("/documents", {}, token);

  assert.equal(listed.status, 200);

  const documents = listed.data.documents ?? listed.data;
  const document = documents.find((item) => item.title === title);

  assert.ok(document, `Could not find created document: ${title}`);

  return document.id;
}

before(async () => {
  // Create two independent organizations and their administrator users.
  aliceToken = await registerOrganization(
    `Alice Test Org ${unique}`,
    "Alice",
    `alice-${unique}@example.test`
  );

  bobToken = await registerOrganization(
    `Bob Test Org ${unique}`,
    "Bob",
    `bob-${unique}@example.test`
  );

  // Create one project and document in each organization.
  aliceProjectId = await createProject(
    aliceToken,
    `Alice Test Project ${unique}`
  );

  bobProjectId = await createProject(
    bobToken,
    `Bob Test Project ${unique}`
  );

  aliceDocumentId = await createDocument(
    aliceToken,
    aliceProjectId,
    `Alice Test Document ${unique}`
  );

  bobDocumentId = await createDocument(
    bobToken,
    bobProjectId,
    `Bob Test Document ${unique}`
  );
});

test(`BOLA security tests — ${isSecure ? "secure" : "vulnerable"} application`, async (t) => {
  await t.test("allows Alice to access her own project", async () => {
    const response = await apiRequest(
      `/projects/${aliceProjectId}`,
      {},
      aliceToken
    );

    recordBolaResult({
      id: "BOLA-001",
      test: "Current tenant project access",
      method: "GET",
      endpoint: `/api/projects/${aliceProjectId}`,
      input: "Alice's JWT + Alice's project ID",
      expectedStatus: 200,
      actualStatus: response.status,
      expectedBehavior: "Alice should be able to access her own project",
      actualBehavior: `HTTP ${response.status}`,
    });

    assert.equal(response.status, 200, "Alice should be able to access her own project");
  });

  await t.test("allows Alice to access her own document", async () => {
    const response = await apiRequest(
      `/documents/${aliceDocumentId}`,
      {},
      aliceToken
    );

    recordBolaResult({
      id: "BOLA-002",
      test: "Current tenant document access",
      method: "GET",
      endpoint: `/api/documents/${aliceDocumentId}`,
      input: "Alice's JWT + Alice's document ID",
      expectedStatus: 200,
      actualStatus: response.status,
      expectedBehavior: "Alice should be able to access her own document",
      actualBehavior: `HTTP ${response.status}`,
    });

    assert.equal(
      response.status,
      200,
      "Alice should be able to access her own document"
    );
  });

  await t.test( isSecure ? "blocks Alice from accessing Bob's project" : "allows Alice to access Bob's project", async () => {
      const response = await apiRequest(
        `/projects/${bobProjectId}`,
        {},
        aliceToken
      );

      recordBolaResult({
        id: "BOLA-003",
        test: "Cross-tenant project access",
        method: "GET",
        endpoint: `/api/projects/${bobProjectId}`,
        input: "Alice's JWT + Bob's project ID",
        expectedStatus: 404,
        actualStatus: response.status,
        expectedBehavior: "Cross-tenant access is rejected",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(
        response.status,
        isSecure? 404: 200, //VULN PASSING
        "Cross-tenant project access did not match the expected security behavior"
      );
    }
  );

  await t.test( isSecure ? "blocks Alice from accessing Bob's document" : "allows Alice to access Bob's document", async () => {
      const response = await apiRequest(
        `/documents/${bobDocumentId}`,
        {},
        aliceToken
      );

      recordBolaResult({
        id: "BOLA-004",
        test: "Cross-tenant document access",
        method: "GET",
        endpoint: `/api/documents/${bobDocumentId}`,
        input: "Alice's JWT + Bob's document ID",
        expectedStatus: 404,
        actualStatus: response.status,
        expectedBehavior: "Cross-tenant access is rejected",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(
        response.status,
        isSecure? 404: 200, //VULN PASSING
        "Cross-tenant document access did not match the expected security behavior"
      );
    }
  );

  await t.test(
    "only show Alice's organisation projects in Alice's project list",
    async () => {
      const response = await apiRequest("/projects", {}, aliceToken);

      assert.equal(response.status, 200);

      const projects = response.data.projects ?? response.data;

      recordBolaResult({
        id: "BOLA-005",
        test: "Current tenant project access",
        method: "GET",
        endpoint: `/api/projects/`,
        input: "Alice's JWT + All org project IDs",
        expectedStatus: 200,
        actualStatus: response.status,
        expectedBehavior: "Alice should be able to see her organisation's projects only",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.ok(
        !projects.some(
          (project) => Number(project.id) === Number(bobProjectId)
        ),
        "Alice should be able to see her organisation's projects only"
      );
    }
  );

  await t.test(
    "only show Alice's organisation documents in Alice's project list",
    async () => {
      const response = await apiRequest("/documents", {}, aliceToken);

      assert.equal(response.status, 200);

      const documents = response.data.documents ?? response.data;

      recordBolaResult({
        id: "BOLA-006",
        test: "Current tenant document access",
        method: "GET",
        endpoint: `/api/documents/`,
        input: "Alice's JWT + All org document IDs",
        expectedStatus: 200,
        actualStatus: response.status,
        expectedBehavior: "Alice should be able to see her organisation's documents only",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.ok(
        !documents.some(
          (document) => Number(document.id) === Number(bobDocumentId)
        ),
        "Alice should be able to see her organisation's documents only"
      );
    }
  );
});

after(async () => {
  const filePath = process.env.SECURITY_REPORT_FILE;

  if (filePath) {
    await exportSecurityResults(filePath);
  }
});