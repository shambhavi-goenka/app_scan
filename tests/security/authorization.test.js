
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { apiRequest, isSecure } from "./config.js";

async function registerAccount({
  organizationName,
  name,
  email,
}) {
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

async function createProject(token, name) {
  const response = await apiRequest(
    "/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        description: "Authorization security test",
      }),
    },
    token
  );

  assert.equal(response.status, 201, "Project creation should succeed");
  assert.ok(response.data.project?.id, "Created project should have an ID");

  return response.data.project.id;
}

test("project deletion authorization", async (t) => {
  const unique = randomUUID();

  const registration = await registerAccount({
    organizationName: `Authorization Test ${unique}`,
    name: "Authorization Admin",
    email: `auth-admin-${unique}@example.test`,
  });

  const adminToken = registration.token;

  assert.ok(adminToken, "Registration should return an admin token");

  // Create a normal user through the user-management API.
  const userResponse = await apiRequest(
    "/users",
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

  assert.equal(loginResponse.status, 200, "Normal user should be able to log in");

  const userToken = loginResponse.data.token;
  assert.ok(userToken, "Login should return a user token");

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

    assert.equal(
      response.status,
      200,
      "Administrator should be allowed to delete a project"
    );
  });

  // Create another project so the normal-user test has its own target.
  const userProjectId = await createProject(
    adminToken,
    `User Authorization Project ${unique}`
  );

  const response = await apiRequest(
    `/projects/${userProjectId}`,
    { method: "DELETE" },
    userToken
  );

  if (isSecure) {
    assert.equal(
      response.status,
      403,
      "Secure app should prevent normal users from deleting projects"
    );
  } else {
    assert.equal(
      response.status,
      200,
      "Vulnerable app should demonstrate that normal users can delete projects"
    );
  }
});
