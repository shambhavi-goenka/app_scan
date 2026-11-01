
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { apiRequest, isSecure } from "./config.js";
import { recordSecurityResult, exportSecurityResults, } from "./reporting.js";

function recordLeastPrivilegeResult({ id, test, method, endpoint, input, expectedStatus, actualStatus, expectedBehavior, actualBehavior, passed}) {
  recordSecurityResult({ id, category: "Least privilege", test, method, endpoint, input, expectedStatus, actualStatus, expectedBehavior, actualBehavior, passed});
}
// Helper: register an organization and its administrator.
async function registerAccount({ organizationName, name, email, }) {
  const response = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      organizationName,
      name,
      email,
      password: "StrongPassword123!",
    }),
  });

  assert.equal(response.status, 201, "Account registration should succeed");

  return response.data;
}

// Helper: create a project.
async function createProject(token, name) {
  const response = await apiRequest( "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description: "Least privilege security test",
      }),
    },
    token
  );

  assert.equal(response.status, 201, "Project creation should succeed");
  assert.ok(response.data.project?.id, "Created project should have an ID");

  return response.data.project.id;
}

// whether a client can assign an administrator role to a newly created account
test("client-supplied administrator role is ignored during user creation", async () => {
  const unique = randomUUID();
  const adminEmail = `mass-admin-${unique}@example.com`;


  const registration = await registerAccount({
    organizationName: `Mass Assignment ${unique}`,
    name: "Test Admin",
    email: adminEmail,
    });

  const adminToken = registration.token; //response.data is sent

  const response = await apiRequest("/users",
    {
      method: "POST",
      body: JSON.stringify({
        name: "Injected Admin",
        email: `injected-${unique}@example.com`,
        password: "InjectedPassword123!",
        role: "admin",
      }),
    },
    adminToken
  );

  recordLeastPrivilegeResult({
    id: "LP-001",
    test: "Client-supplied administrator role",
    method: "POST",
    endpoint: "/api/users",
    input: "Admin creates a user with role: admin",
    expectedStatus: 201,
    actualStatus: response.status,
    expectedBehavior: "User should have role - user",
    actualBehavior: `HTTP ${response.status}, User Role - ${response.data.user.role}`,
    passed: response.status === 201 && response.data.user.role === "user",
  });

  assert.equal(response.status, 201);
  assert.equal( response.data.user.role, 
    isSecure? "user": "admin", //VULN PASSING
    "Secure app must ignore the requested admin role" );

});

//Project deletion authorisation.
test("project deletion authorisation", async (t) => {
  const unique = randomUUID();

  const registration = await registerAccount({
    organizationName: `Authorisation Test ${unique}`,
    name: "Authorisation Admin",
    email: `auth-admin-${unique}@example.test`,
    });

  const adminToken = registration.token;
  assert.ok(adminToken, "Registration should return an admin token");

  // Admin creates a normal user.
  const userResponse = await apiRequest("/users",
    {
      method: "POST",
      body: JSON.stringify({
        name: "Normal User",
        email: `normal-user-${unique}@example.test`,
        password: "StrongPassword123!",
        role: "user",
      }),
    },
    adminToken
  );

  assert.equal(userResponse.status, 201, "Admin should create a normal user");

  const loginResponse = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: `normal-user-${unique}@example.test`,
      password: "StrongPassword123!",
    }),
  });

  assert.equal(loginResponse.status, 200, "Normal user should log in");

  const userToken = loginResponse.data.token;
  assert.ok(userToken, "Login should return a user token");

  //Administrator can delete a project.
  const projectId = await createProject(
    adminToken,
    `Authorization Project ${unique}`
  );

  await t.test("administrator can delete a project", async () => {
    const response = await apiRequest(
      `/projects/${projectId}`,
      { method: "DELETE" },
      adminToken
    );

    recordLeastPrivilegeResult({
      id: "LP-002",
      test: "Admin project deletion",
      method: "DELETE",
      endpoint: `/api/projects/${projectId}`,
      input: "Admin JWT + project ID",
      expectedStatus: 200,
      actualStatus: response.status,
      expectedBehavior: "Admin should be allowed to delete a project",
      actualBehavior: `HTTP ${response.status}`,
      passed: response.status === 200
    });

    assert.equal( response.status, 200, "Admin should be allowed to delete a project" );
  });

  //Normal user attempts to delete a project.
  const userProjectId = await createProject(
    adminToken,
    `User Authorization Project ${unique}`
  );

  const response = await apiRequest(
    `/projects/${userProjectId}`,
    { method: "DELETE" },
    userToken
  );

  recordLeastPrivilegeResult({
    id: "LP-003",
    test: "User project deletion",
    method: "DELETE",
    endpoint: `/api/projects/${userProjectId}`,
    input: "User JWT + project ID",
    expectedStatus: 403,
    actualStatus: response.status,
    expectedBehavior: "Normal user must be forbidden from deleting projects",
    actualBehavior: `HTTP ${response.status}`,
    passed: response.status === 403
  });

  assert.equal( response.status, 
    isSecure? 403: 200, //VULN PASSING, 
    "Normal user should not be allowed to delete a project" );

});

// Export all results for the scanner.
after(async () => {
  const filePath = process.env.SECURITY_REPORT_FILE;

  if (filePath) {
    await exportSecurityResults(filePath);
  }
});
