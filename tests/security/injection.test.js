
import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { apiRequest, isSecure } from "./config.js";

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

  if (isSecure) {
    assert.equal(response.status, 401);
    assert.equal(response.data.token, undefined);
  } else {
    assert.equal(
      response.status,
      200,
      `Expected injected login to succeed: ${JSON.stringify(response.data)}`
    );

    assert.ok(response.data.token);
    assert.equal(response.data.user.email, "injected@example.test");
  }
});
