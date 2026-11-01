import test, { after } from "node:test";
import assert from "node:assert/strict";
import { apiRequest, isSecure } from "./config.js";
import { recordSecurityResult, exportSecurityResults, } from "./reporting.js";

function recordErrorHandlingResult({ id, test, method, endpoint, input, expectedStatus, actualStatus, expectedBehavior, actualBehavior, passed}) {
  recordSecurityResult({ id, category: "Error handling", test, method, endpoint, input, expectedStatus, actualStatus, expectedBehavior, actualBehavior, passed});
}

test("unknown API route returns a 404 response", async () => {
  const response = await apiRequest(`/route-that-does-not-exist-${Date.now()}`);

  recordErrorHandlingResult({
    id: "ERR-001",
    test: "Unknown API route returns 404 + not found error",
    endpoint: `/route-that-does-not-exist-${Date.now()}`,
    expectedStatus: 404,
    actualStatus: response.status,
    expectedBehavior: 'Unknown routes should return HTTP 404 with error "Not Found".',
    actualBehavior: `HTTP ${response.status}, Response: ${JSON.stringify(response.data)}`,
    passed: response.status === 404 && response.data.error === "Not Found",
    });

  assert.equal(response.status, 404);

  if (isSecure) {
    assert.equal(response.data.error, "Not Found");
  } 
  else { // Express default 404 response is HTML, not JSON.
    // assert.equal(typeof response.data, "object");
    assert.deepEqual(response.data, {});
  }
});

test("health endpoint does not expose internal errors", async () => {
  const response = await apiRequest("/health");

  recordErrorHandlingResult({
    id: "ERR-002",
    test: "Health endpoint does not expose internal errors",
    endpoint: "/health",
    expectedStatus: "200 or 503",
    actualStatus: response.status,
    expectedBehavior:"Health endpoint should report the application status without exposing stack traces or SQL queries.",
    actualBehavior: `HTTP ${response.status}, Response: ${JSON.stringify(response.data)}`,
    passed: response.status === 503 ? response.data.status === "error" && response.data.database === "unavailable" && !("stack" in response.data) && !("sql" in response.data) : response.status === 200 && response.data.status === "ok",
    });

  if (response.status === 503) {
    assert.equal(response.data.status, "error");
    assert.equal(response.data.database, "unavailable");
    assert.equal("stack" in response.data, false);
    assert.equal("sql" in response.data, false);
  } else 
    {
    assert.equal(response.status, 200);
    assert.equal(response.data.status, "ok");
  }
});

test("unknown routes do not expose stack traces", async () => {
  const response = await apiRequest(
    `/unknown-${Date.now()}`
  );

  recordErrorHandlingResult({
    id: "ERR-003",
    test: "Unknown routes do not expose stack traces",
    endpoint: `/unknown-${Date.now()}`,
    expectedStatus: 404,
    actualStatus: response.status,
    expectedBehavior:"Unknown routes should return 404 without exposing stack traces or internal file paths.",
    actualBehavior: `HTTP ${response.status}, Response: ${JSON.stringify(response.data)}`,
    passed: response.status === 404 && !("stack" in response.data) && !JSON.stringify(response.data).includes("node_modules"),
    });

  assert.equal(response.status, 404);
  assert.equal("stack" in response.data, false);
  assert.equal(JSON.stringify(response.data).includes("node_modules"), false);
});

test("CORS allows the configured frontend origin", async () => {
  const origin = isSecure ? "http://localhost:5174" : "http://localhost:5173";

  const response = await fetch(
    `${isSecure ? "http://127.0.0.1:3002" : "http://127.0.0.1:3001"}/api/health`,
    {
      headers: {
        Origin: origin
      }
    }
  );

  recordErrorHandlingResult({
    id: "ERR-004",
    test: "CORS allows the configured frontend origin",
    endpoint: "/api/health",
    input: `Origin: ${origin}`,
    expectedStatus: 200,
    actualStatus: response.status,
    expectedBehavior:`CORS should allow the configured frontend origin ${origin}.`,
    actualBehavior:`HTTP ${response.status}, Access-Control-Allow-Origin: ${response.headers.get("access-control-allow-origin")}`,
    passed: response.headers.get("access-control-allow-origin") === origin,
    });

  assert.equal(
    response.headers.get("access-control-allow-origin"),
    origin
  );
});

test("CORS does not allow an untrusted origin", async () => {
  const baseUrl = isSecure ? "http://127.0.0.1:3002" : "http://127.0.0.1:3001";

  const response = await fetch(`${baseUrl}/api/health`, {
    headers: {
      Origin: "http://evil.example"
    }
  });

  recordErrorHandlingResult({
    id: "ERR-005",
    test: "CORS does not allow an untrusted origin",
    endpoint: "/api/health",
    input: "Origin: http://evil.example",
    expectedStatus: 200,
    actualStatus: response.status,
    expectedBehavior:"CORS should not return an allow-origin header for an untrusted origin.",
    actualBehavior:`HTTP ${response.status}, Access-Control-Allow-Origin: ${response.headers.get("access-control-allow-origin")}`,
    passed: response.headers.get("access-control-allow-origin") === null,
    });

  assert.equal( response.headers.get("access-control-allow-origin"), null );
});

test("secure backend disables caching of API responses", async () => {
  if (!isSecure) return;

  const baseUrl = isSecure ? "http://127.0.0.1:3002" : "http://127.0.0.1:3001";
  const response = await fetch(`${baseUrl}/api/health`);

  const cacheControl = response.headers.get("cache-control");

  recordErrorHandlingResult({
    id: "ERR-007",
    test: "Secure backend disables caching of API responses",
    endpoint: "/api/health",
    expectedStatus: 200,
    actualStatus: response.status,
    expectedBehavior:"Secure API responses should include private and no-store cache directives.",
    actualBehavior:`HTTP ${response.status}, Cache-Control: ${cacheControl}`,
    passed: Boolean(cacheControl) && /no-store/i.test(cacheControl) && /private/i.test(cacheControl),
    });

  assert.ok(cacheControl);
  assert.match(cacheControl, /no-store/i);
  assert.match(cacheControl, /private/i);
});

// Export all results for the scanner.
after(async () => {
  const filePath = process.env.SECURITY_REPORT_FILE;

  if (filePath) {
    await exportSecurityResults(filePath);
  }
});