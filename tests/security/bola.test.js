import test, { before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { apiRequest, isSecure } from "./config.js";

let aliceToken;
let bobToken;
let aliceProjectId;
let bobProjectId;
let aliceDocumentId;
let bobDocumentId;

const unique = randomUUID().slice(0, 8);
const expectedCrossTenantStatus = isSecure ? 404 : 200;

async function registerOrganization(organizationName, name, email) {
  const result = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      organizationName,
      name,
      email,
      password: "TestPassword!123",
    }),
  });

  assert.equal(
    result.status,
    201,
    `Registration failed: ${JSON.stringify(result.data)}`
  );

  assert.ok(result.data.token, "Registration did not return a token");

  return result.data.token;
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
    const result = await apiRequest(
      `/projects/${aliceProjectId}`,
      {},
      aliceToken
    );

    assert.equal(result.status, 200, "Alice should be able to access her own project");
  });

  await t.test("allows Alice to access her own document", async () => {
    const response = await apiRequest(
      `/documents/${aliceDocumentId}`,
      {},
      aliceToken
    );

    assert.equal(
      response.status,
      200,
      "Alice should be able to access her own document"
    );
  });

  await t.test(
    isSecure
      ? "blocks Alice from accessing Bob's project"
      : "allows Alice to access Bob's project",
    async () => {
      const result = await apiRequest(
        `/projects/${bobProjectId}`,
        {},
        aliceToken
      );

      assert.equal(
        result.status,
        expectedCrossTenantStatus,
        "Cross-tenant project access did not match the expected security behavior"
      );
    }
  );

  await t.test(
    isSecure
      ? "blocks Alice from accessing Bob's document"
      : "allows Alice to access Bob's document",
    async () => {
      const result = await apiRequest(
        `/documents/${bobDocumentId}`,
        {},
        aliceToken
      );

      assert.equal(
        result.status,
        expectedCrossTenantStatus,
        "Cross-tenant document access did not match the expected security behavior"
      );
    }
  );

  await t.test(
    "does not show Bob's project in Alice's project list",
    async () => {
      const result = await apiRequest("/projects", {}, aliceToken);

      assert.equal(result.status, 200);

      const projects = result.data.projects ?? result.data;

      assert.ok(
        !projects.some(
          (project) => Number(project.id) === Number(bobProjectId)
        ),
        "Alice should not see Bob's project in her project list"
      );
    }
  );

  await t.test(
    "does not show Bob's document in Alice's document list",
    async () => {
      const result = await apiRequest("/documents", {}, aliceToken);

      assert.equal(result.status, 200);

      const documents = result.data.documents ?? result.data;

      assert.ok(
        !documents.some(
          (document) => Number(document.id) === Number(bobDocumentId)
        ),
        "Alice should not see Bob's document in her document list"
      );
    }
  );
});