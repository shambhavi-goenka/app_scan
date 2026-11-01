import test, { after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { apiRequest, isSecure } from "./config.js";
import { recordSecurityResult, exportSecurityResults } from "./reporting.js";

// Load the selected backend's environment before importing its database pool.
const path = isSecure? 'secure':'vulnerable';
const require = createRequire( new URL(`../../apps/${path}-app/backend/package.json`, import.meta.url) );
require("dotenv").config({ path: new URL( `../../apps/${path}-app/backend/.env`, import.meta.url ) });
const { default: pool } = await import( `../../apps/${path}-app/backend/src/config/database.js` );

after(async () => {
  await pool.end(); // Close database connections after all tests finish

  const filePath = process.env.SECURITY_REPORT_FILE;
  if (filePath) {
    await exportSecurityResults(filePath);
  }
});

function recordPasswordSecResult({ id, test, method, endpoint, input, expectedStatus, actualStatus, expectedBehavior, actualBehavior, passed}) {
  recordSecurityResult({ id, category: "Password Security", test, method, endpoint, input, expectedStatus, actualStatus, expectedBehavior, actualBehavior, passed});
}

test(`${isSecure ? "secure" : "vulnerable"}: registration hashes passwords and does not expose password data`, async () => {
  const unique = randomUUID();
  const email = `password-test-${unique}@example.test`;
  const password = "StrongTestPassword123!";

  let organizationId;

  try {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        organizationName: `Password Test ${unique}`,
        name: "Password Test User",
        email,
        password
      })
    });

    assert.equal(response.status, 201, `Registration failed: ${JSON.stringify(response.data)}`);

    const user = response.data.user;

    assert.ok(user);
    assert.equal(user.email, email);
    assert.equal(user.role, "admin");

    assert.equal("password" in user, false);
    assert.equal("password_hash" in user, false);
    assert.equal(JSON.stringify(response.data).includes(password), false);

    organizationId = response.data.organization.id;

    const [rows] = await pool.execute(
      "SELECT password_hash FROM users WHERE email = ?",
      [email]
    );

    assert.equal(rows.length, 1);

    const storedHash = rows[0].password_hash;

    assert.notEqual(storedHash, password);
    assert.match(storedHash, /^\$2[aby]\$12\$/); //check bycrypt count 12 used for hashing

    assert.equal( await bcrypt.compare(password, storedHash), true );
    assert.equal( await bcrypt.compare("WrongPassword123!", storedHash), false );

    recordPasswordSecResult({
      id: "PS-001",
      test: "Check password is hashed",
      method: "POST",
      endpoint: "/auth/register",
      input: "New user password",
      expectedStatus: 201,
      actualStatus: response.status,
      expectedBehavior: "Password should be hashed before storing in database",
      actualBehavior: `HTTP ${response.status}`,
      passed: /^\$2[aby]\$12\$/.test(storedHash)
    });
  } 
  finally {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        "DELETE FROM users WHERE email = ?",
        [email]
      );

      if (organizationId) {
        await connection.execute(
          "DELETE FROM organizations WHERE id = ?",
          [organizationId]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
});

test(`${isSecure ? "secure" : "vulnerable"}: SQL injection in login`, async () => {
  const password = "InjectedPassword123!";
  const hash = await bcrypt.hash(password, 12);

  // The final "- " ensures the SQL comment marker retains
  // whitespace after email.trim() executes.
  const hashHex = Buffer.from(hash, "utf8").toString("hex");
  const injectedEmail =
    `nonexistent-${Date.now()}' UNION SELECT ` +
    `999,1,'Injected User','injected@example.test',` +
    `CONVERT(UNHEX('${hashHex}') USING utf8mb4),'admin' -- -`;

  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: injectedEmail,
      password
    })
  });

  recordPasswordSecResult({
    id: "PS-002",
    test: "Check for SQL injection",
    method: "POST",
    endpoint: "/auth/login",
    input: "SQL in email field",
    expectedStatus: 401,
    actualStatus: response.status,
    expectedBehavior: "Email should be sanitised before processing",
    actualBehavior: `HTTP ${response.status}`,
    passed: response.status === 401
  });

  if (isSecure) {
    assert.equal(response.status, 401);
    assert.equal(response.data.token, undefined);
  } 
  else {
    assert.equal( response.status, 200, `Expected injected login to succeed: ${JSON.stringify(response.data)}` );
    assert.ok(response.data.token);
    assert.equal(response.data.user.email, "injected@example.test");
  }
});