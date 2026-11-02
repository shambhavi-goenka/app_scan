import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { apiRequest, isSecure } from "./config.js";
import { recordSecurityResult, exportSecurityResults } from "./reporting.js";

let adminToken;
let projectId;

function recordInputValResult({ id, test, method, endpoint, input, expectedStatus, actualStatus, expectedBehavior, actualBehavior, }) {
  recordSecurityResult({ id, category: "Input validation", test, method, endpoint, input, expectedStatus, actualStatus, expectedBehavior, actualBehavior, passed: actualStatus === expectedStatus, });
}

const unique = randomUUID().slice(0, 8);

async function registerOrganization() {
  const response = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      organizationName: `Input Validation Test ${unique}`,
      name: "Validation Tester",
      email: `validation-${unique}@example.test`,
      password: "TestPassword!123",
    }),
  });

  assert.equal( response.status, 201, `Registration failed: ${JSON.stringify(response.data)}` );

  return response.data.token;
}

async function createProject(token) {
  const response = await apiRequest(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: `Validation Project ${unique}`,
        description: "Input validation security tests",
      }),
    },
    token
  );

  assert.equal(
    response.status,
    201,
    `Project creation failed: ${JSON.stringify(response.data)}`
  );

  const listed = await apiRequest("/projects", {}, token);
  const projects = listed.data.projects ?? listed.data;

  const project = projects.find(
    (item) => item.name === `Validation Project ${unique}`
  );

  assert.ok(project, "Could not find test project");

  return project.id;
}

async function submitProject(payload, token = adminToken) {
  return apiRequest(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

before(async () => {
  adminToken = await registerOrganization();
  projectId = await createProject(adminToken);
});

after(async () => {
  const filePath = process.env.SECURITY_REPORT_FILE;
  if (filePath) {
    await exportSecurityResults(filePath);
  }
});

async function createDocument(payload) {
  return apiRequest(
    "/documents",
    {
      method: "POST",
      body: JSON.stringify({
        projectId,
        ...payload,
      }),
    },
    adminToken
  );
}

test(
  `Input validation tests — ${isSecure ? "secure" : "vulnerable"} application`,
  async (t) => {
    await t.test("rejects an empty document title", async () => {
      const response = await createDocument({
        title: "   ",
        content: "Test content",
      });

      recordInputValResult({
        id: "INPV-001",
        test: "Create document with empty title",
        method: "POST",
        endpoint: `/api/documents/`,
        input: "Login JWT + project ID",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Document creation with empty title is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, 400);
    });

    await t.test(`${isSecure ? "rejects" : "accepts"} a non-string document title`, async () => {
      const response = await createDocument({
        title: 12345,
        content: "Test content",
      });

      recordInputValResult({
        id: "INPV-002",
        test: "Create document with non string title",
        method: "POST",
        endpoint: `/api/documents/`,
        input: "Login JWT + project ID",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Document creation with non-string title is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, isSecure? 400 : 201); //VULN PASSING
    });

    await t.test("rejects a title exceeding 200 characters", async () => {
      const response = await createDocument({
        title: "A".repeat(201),
        content: "Test content",
      });

      recordInputValResult({
        id: "INPV-003",
        test: "Create document with long title",
        method: "POST",
        endpoint: `/api/documents/`,
        input: "Login JWT + project ID",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Document creation with title over 200 chars is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, 400);
    });

    await t.test("accepts a title of exactly 200 characters", async () => {
      const response = await createDocument({
        title: `T${"A".repeat(199)}`,
        content: "Test content",
      });

      recordInputValResult({
        id: "INPV-004",
        test: "Create document with 200 char title",
        method: "POST",
        endpoint: `/api/documents/`,
        input: "Login JWT + project ID",
        expectedStatus: 201,
        actualStatus: response.status,
        expectedBehavior: "Document creation title upto 200 char is allowed",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal( response.status, 201, `Expected 201: ${JSON.stringify(response.data)}` );
    });

    await t.test("rejects non-string document content", async () => {
      const response = await createDocument({
        title: `Invalid Content ${unique}`,
        content: 12345,
      });

      recordInputValResult({
        id: "INPV-005",
        test: "Create document with non string content",
        method: "POST",
        endpoint: `/api/documents/`,
        input: "Login JWT + project ID",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Document creation with non string content is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, 400);
    });

    await t.test("rejects content exceeding 20,000 characters", async () => {
      const response = await createDocument({
        title: `Oversized Content ${unique}`,
        content: "A".repeat(20001),
      });

      recordInputValResult({
        id: "INPV-006",
        test: "Create document with long content",
        method: "POST",
        endpoint: `/api/documents/`,
        input: "Login JWT + project ID",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Document creation with over 20,000 char is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, 400);
    });

    await t.test("accepts content of exactly 20,000 characters", async () => {
      const content = "A".repeat(20000);

      const response = await createDocument({
        title: `Maximum Content ${unique}`,
        content,
      });

      recordInputValResult({
        id: "INPV-007",
        test: "Create document with 20,000 char content",
        method: "POST",
        endpoint: `/api/documents/`,
        input: "Login JWT + project ID",
        expectedStatus: 201,
        actualStatus: response.status,
        expectedBehavior: "Document creation content upto 20,000 is allowed",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal( response.status, 201, `Expected 201: ${JSON.stringify(response.data)}` );

      const documentId = response.data.document.id;
      const retrieved = await apiRequest( `/documents/${documentId}`, {}, adminToken );

      assert.equal(retrieved.status, 200);
      assert.equal(retrieved.data.document.content.length, 20000);
      assert.equal(retrieved.data.document.content, content);
    });

    await t.test("rejects an invalid project ID", async () => {
      const response = await apiRequest(
        "/documents",
        {
          method: "POST",
          body: JSON.stringify({
            projectId: -1,
            title: "Invalid Project",
            content: "Test content",
          }),
        },
        adminToken
      );

      recordInputValResult({
        id: "INPV-008",
        test: "Create document with invalid ID",
        method: "POST",
        endpoint: `/api/documents/`,
        input: "Login JWT + project ID",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Document creation with invalid project ID is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, 400);
    });
  }
);

test(
  `Project input validation tests — ${isSecure ? "secure" : "vulnerable"} application`,
  async (t) => {
    await t.test("rejects an empty project name", async () => {
      const response = await submitProject({
        name: "   ",
        description: "Test description",
      });

      recordInputValResult({
        id: "INPV-009",
        test: "Create project with empty name",
        method: "POST",
        endpoint: `/api/projects/`,
        input: "Login JWT + project payload",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Project creation with empty name is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, 400);
    });

    await t.test("rejects a non-string project name", async () => {
      const response = await submitProject({
        name: 12345,
        description: "Test description",
      });

      recordInputValResult({
        id: "INPV-010",
        test: "Create project with non string name",
        method: "POST",
        endpoint: `/api/projects/`,
        input: "Login JWT + project payload",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Project creation with non string name is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, 400);
    });

    await t.test("rejects a project name exceeding 150 characters", async () => {
      const response = await submitProject({
        name: "A".repeat(151),
        description: "Test description",
      });

      recordInputValResult({
        id: "INPV-011",
        test: "Create project with long name",
        method: "POST",
        endpoint: `/api/projects/`,
        input: "Login JWT + project payload",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Project creation with name over 150 chars is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, 400);
    });

    await t.test("accepts a project name of exactly 150 characters", async () => {
      const response = await submitProject({
        name: `P${"A".repeat(149)}`,
        description: "Test description",
      });

      recordInputValResult({
        id: "INPV-012",
        test: "Create project with 150 char name",
        method: "POST",
        endpoint: `/api/projects/`,
        input: "Login JWT + project payload",
        expectedStatus: 201,
        actualStatus: response.status,
        expectedBehavior: "Project creation with name upto 150 chars is allowed",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal( response.status, 201, `Expected 201: ${JSON.stringify(response.data)}` );
    });

    await t.test("rejects a non-string project description", async () => {
      const response = await submitProject({
        name: `Invalid Description ${unique}`,
        description: 12345,
      });

      recordInputValResult({
        id: "INPV-013",
        test: "Create project with non string description",
        method: "POST",
        endpoint: `/api/projects/`,
        input: "Login JWT + project payload",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Project creation with non string description is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, 400);
    });

    await t.test("rejects a project description exceeding 5000 characters",async () => {
        const response = await submitProject({
          name: `Oversized Description ${unique}`,
          description: "A".repeat(5001),
        });

        recordInputValResult({
        id: "INPV-014",
        test: "Create project with long description",
        method: "POST",
        endpoint: `/api/projects/`,
        input: "Login JWT + project payload",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Project creation with description over 5,000 chars is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

        assert.equal(response.status, 400);
      }
    );

    await t.test("accepts a project description of exactly 5000 characters", async () => {
        const description = "A".repeat(5000);

        const response = await submitProject({
          name: `Maximum Description ${unique}`,
          description,
        });

        recordInputValResult({
        id: "INPV-015",
        test: "Create project with 5,000 char description",
        method: "POST",
        endpoint: `/api/projects/`,
        input: "Login JWT + project payload",
        expectedStatus: 201,
        actualStatus: response.status,
        expectedBehavior: "Project creation with description upto 5,000 char is allowed",
        actualBehavior: `HTTP ${response.status}`,
      });

        assert.equal( response.status, 201, `Expected 201: ${JSON.stringify(response.data)}` );
      }
    );

    await t.test("rejects a missing project name", async () => {
      const response = await submitProject({
        description: "Test description",
      });

      recordInputValResult({
        id: "INPV-016",
        test: "Create project with missing name",
        method: "POST",
        endpoint: `/api/projects/`,
        input: "Login JWT + project payload",
        expectedStatus: 400,
        actualStatus: response.status,
        expectedBehavior: "Project creation with missing name is forbidden",
        actualBehavior: `HTTP ${response.status}`,
      });

      assert.equal(response.status, 400);
    });

    await t.test("accepts a missing project description if required", async () => {
      const response = await submitProject({
        name: `Missing Description ${unique}`,
      });

      recordInputValResult({
        id: "INPV-017",
        test: "Create project with missing description",
        method: "POST",
        endpoint: `/api/projects/`,
        input: "Login JWT + project payload",
        expectedStatus: 201,
        actualStatus: response.status,
        expectedBehavior: "Project creation with missing description is allowed",
        actualBehavior: `HTTP ${response.status}`,
      });
      
      assert.equal( response.status, 201, `Expected 201: ${JSON.stringify(response.data)}` );
    });
  }
);