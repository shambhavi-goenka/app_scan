import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { apiRequest, isSecure } from "./config.js";

// whether a client can assign an administrator role to a newly created account
test("client-supplied administrator role is ignored during user creation", async () => {
  const unique = randomUUID();

  const adminEmail = `mass-admin-${unique}@example.com`;

  const registration = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      organizationName: `Mass Assignment ${unique}`,
      name: "Test Admin",
      email: adminEmail,
      password: "AdminPassword123!"
    })
  });

  assert.equal(registration.status, 201);

  const adminToken = registration.data.token;

  // Admin creates a user while attempting to assign the admin role.
  const response = await apiRequest(
    "/users",
    {
      method: "POST",
      body: JSON.stringify({
        name: "Injected Admin",
        email: `injected-${unique}@example.com`,
        password: "InjectedPassword123!",
        role: "admin"
      })
    },
    adminToken
  );

  assert.equal(response.status, 201);

  if (isSecure) {
    assert.equal(
      response.data.user.role,
      "user", //still a user role
      "Secure app must ignore the requested admin role"
    );
  } else {
    assert.equal(
      response.data.user.role,
      "admin", //changed to admin role
      "Vulnerable app should allow the requested admin role"
    );
  }
});
