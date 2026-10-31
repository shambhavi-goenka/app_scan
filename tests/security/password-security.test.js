
import test, { after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { apiRequest, isSecure } from "./config.js";

// Load the selected backend's environment before importing its database pool.
const backendPackage = isSecure
  ? "../../apps/secure-app/backend/package.json"
  : "../../apps/vulnerable-app/backend/package.json";

const backendEnv = isSecure
  ? "../../apps/secure-app/backend/.env"
  : "../../apps/vulnerable-app/backend/.env";

const backendDatabase = isSecure
  ? "../../apps/secure-app/backend/src/config/database.js"
  : "../../apps/vulnerable-app/backend/src/config/database.js";

const require = createRequire(new URL(backendPackage, import.meta.url));

require("dotenv").config({
  path: new URL(backendEnv, import.meta.url)
});

const { default: pool } = await import(backendDatabase);

after(async () => {
  await pool.end();
});

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

    assert.equal(
      response.status,
      201,
      `Registration failed: ${JSON.stringify(response.data)}`
    );

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
    assert.match(storedHash, /^\$2[aby]\$12\$/);

    assert.equal(
      await bcrypt.compare(password, storedHash),
      true
    );

    assert.equal(
      await bcrypt.compare("WrongPassword123!", storedHash),
      false
    );
  } finally {
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
