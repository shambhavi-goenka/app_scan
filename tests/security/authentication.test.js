import test, { after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { apiRequest, isSecure } from "./config.js";

// required to delete user from sql for test
import { createRequire } from "node:module";
const path = isSecure? 'secure':'vulnerable';
const require = createRequire( new URL(`../../apps/${path}-app/backend/package.json`, import.meta.url) );
require("dotenv").config({ path: new URL( `../../apps/${path}-app/backend/.env`, import.meta.url ) });
const { default: pool } = await import( `../../apps/${path}-app/backend/src/config/database.js` );
after(async () => { await pool.end(); }); // Close database connections after all tests finish

// These must match the actual backend secrets.
// Never use production secrets here.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    `Missing ${isSecure ? "SECURE" : "VULNERABLE"}_TEST_JWT_SECRET`
  );
}

const JWT_ISSUER = "securesaas-api";
const JWT_AUDIENCE = "securesaas-client";

function createToken({
  subject = "1",
  organizationId = 1,
  role = "admin",
  secret = JWT_SECRET,
  algorithm = "HS256",
  issuer = JWT_ISSUER,
  audience = JWT_AUDIENCE,
  expiresIn = "1h",
} = {}) {
  const payload = { organizationId, role };
  const options = { algorithm, issuer, audience, expiresIn };

  if (subject !== null) {
    options.subject = String(subject);
  }

  return jwt.sign(payload, secret, options);
}

async function registerUser() {
  const unique = randomUUID();

  const response = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      organizationName: `Auth Test ${unique}`,
      name: "Auth Tester",
      email: `auth-${unique}@example.com`,
      password: "StrongPassword123!",
    }),
  });

  assert.equal(
    response.status,
    201,
    "Test account registration should succeed"
  );

  return response.data;
}

// --------------------------------------------------
// Basic authentication
// --------------------------------------------------

test("Missing JWT is rejected", async () => {
  const response = await apiRequest("/auth/me");

  assert.equal(response.status, 401);
});

test("Malformed JWT is rejected", async () => {
  const response = await apiRequest(
    "/auth/me",
    {},
    "not-a-valid-token"
  );

  assert.equal(response.status, 401);
});

test("Tampered JWT signature is rejected", async () => {
  const registration = await registerUser();
  const parts = registration.token.split(".");

  assert.equal(parts.length, 3);

  parts[2] = `${parts[2][0] === "a" ? "b" : "a"}${parts[2].slice(1)}`;

  const response = await apiRequest(
    "/auth/me",
    {},
    parts.join(".")
  );

  assert.equal(response.status, 401);
});

// --------------------------------------------------
// JWT expiration and claim validation
// --------------------------------------------------

test("Expired JWT is rejected", async () => {
  const token = createToken({
    expiresIn: "-1s",
  });

  const response = await apiRequest("/auth/me", {}, token);

  assert.equal(response.status, 401);
});

test("JWT with incorrect issuer is rejected", async () => {
  const token = createToken({
    issuer: "untrusted-issuer",
  });

  const response = await apiRequest("/auth/me", {}, token);

  assert.equal(response.status, 401);
});

test("JWT with incorrect audience is rejected", async () => {
  const token = createToken({
    audience: "untrusted-client",
  });

  const response = await apiRequest("/auth/me", {}, token);

  assert.equal(response.status, 401);
});

test("JWT without a subject is rejected", async () => {
  const token = createToken({ subject: null });

  const decoded = jwt.decode(token);

  assert.equal(
    decoded.sub,
    undefined,
    "Test token must not contain a subject"
  );

  const response = await apiRequest("/auth/me", {}, token);

  assert.equal(
    response.status,
    401,
    "Both applications should reject tokens without a subject"
  );
});

test("JWT with an invalid role is rejected", async () => {
  const token = createToken({
    role: "superadmin",
  });

  const response = await apiRequest("/auth/me", {}, token);

  assert.equal(response.status, 401);
});

test("JWT with an invalid organization ID is rejected", async () => {
  const token = createToken({
    organizationId: -1,
  });

  const response = await apiRequest("/auth/me", {}, token);

  assert.equal(response.status, 401);
});

// --------------------------------------------------
// JWT algorithm restrictions
// --------------------------------------------------

test("Unsupported JWT algorithm is rejected", async () => {
  const token = createToken({
    algorithm: "HS384",
  });

  const response = await apiRequest("/auth/me", {}, token);

  if (isSecure) {
    assert.equal(
      response.status,
      401,
      "Secure app should reject HS384 tokens"
    );
  } else {
    assert.equal(
      response.status,
      200,
      "Vulnerable app should demonstrate acceptance of HS384"
    );
  }
});

// --------------------------------------------------
// Login rate limiting
// --------------------------------------------------

test("Repeated failed login attempts are rate limited correctly", async () => {
  const unique = randomUUID();
  const statuses = [];

  for (let i = 0; i < 7; i++) {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: `bruteforce-${unique}@example.com`,
        password: "WrongPassword123!",
      }),
    });

    statuses.push(response.status);
  }

  if (isSecure) {
    assert.ok(
      statuses.includes(429),
      "Secure app should rate limit repeated failed login attempts"
    );

    assert.ok(
      statuses.every((status) => [401, 429].includes(status)),
      "Secure app should return only 401 or 429"
    );
  } else {
    assert.ok(
      statuses.every((status) => status === 401),
      "Vulnerable app should allow repeated attempts without rate limiting"
    );
  }
});

// --------------------------------------------------
// Weak JWT secret and token forgery
// --------------------------------------------------

test("Weak JWT secret cannot be used to forge an administrator token", async () => {
  const unique = randomUUID();

  const registration = await registerUser();

  const userId = registration.user.id;
  const organizationId = registration.organization.id;

  // assume there's a wordlist (like 4 lol)
  const candidateSecrets = [
    "password",
    "123456",
    "secret",
    "secret123",
    "admin",
  ];

  let recoveredSecret = null;

  if (!isSecure) {
    for (const candidate of candidateSecrets) {
      try {
        jwt.verify(registration.token, candidate, {
          algorithms: ["HS256"],
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        });

        recoveredSecret = candidate;
        break;
      } catch {
        // Candidate secret did not match.
      }
    }

    assert.ok(
      recoveredSecret,
      "Vulnerable app's weak JWT secret should be recoverable"
    );
  }

  // For the secure application, deliberately try the vulnerable secret.
  const signingSecret = isSecure ? "secret123" : recoveredSecret;

  const forgedToken = createToken({
    subject: String(userId),
    organizationId,
    role: "admin",
    secret: signingSecret,
  });

  const response = await apiRequest(
    "/users",
    {
      method: "POST",
      body: JSON.stringify({
        name: "Forged Admin",
        email: `forged-admin-${unique}@example.com`,
        password: "ForgedPassword123!",
        role: "admin",
      }),
    },
    forgedToken
  );

  if (isSecure) {
    assert.equal(
      response.status,
      401,
      "Secure app should reject a token signed with the vulnerable secret"
    );
  } else {
    assert.equal(
      response.status,
      201,
      "Vulnerable app should accept the forged administrator token"
    );

    assert.equal(response.data.user.role, "admin");
  }
});


test("JWT for a deleted user is rejected", async () => {
  const unique = randomUUID();

  const registration = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      organizationName: `Deleted User Test ${unique}`,
      name: "Deleted User",
      email: `deleted-${unique}@example.com`,
      password: "StrongPassword123!"
    })
  });

  assert.equal(registration.status, 201);

  const token = registration.data.token;
  const userId = registration.data.user.id;

  // Delete the user from the database.
  const [result] = await pool.execute(
    "DELETE FROM users WHERE id = ?",
    [userId]
  );

  assert.equal(
    result.affectedRows,
    1,
    "Test user should be deleted successfully"
  );

  // Verify that the previously issued token is rejected.
  const response = await apiRequest("/auth/me", {}, token);

  assert.equal(
    response.status,
    401,
    "A deleted user's token should no longer authenticate"
  );
});
