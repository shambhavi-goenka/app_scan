# secure Security Scan Report

## Summary

- **Target:** secure
- **Tests recorded:** 46
- **Passed:** 46
- **Failed:** 0

## Test Results

| ID | Test | Description | Request | Input | Expected HTTP | Actual HTTP | Result |
|---|---|---|---|---|---:|---:|---|
| AUTH-001 | Check for missing JWT | Missing JWT is rejected | GET /auth/me | N/A | 401 | 401 | PASS |
| AUTH-002 | Check for tampered JWT | Modified JWT is rejected | GET /auth/me | JWT | 401 | 401 | PASS |
| AUTH-003 | Check for expired JWT | Expired JWT is rejected | GET /auth/me | JWT | 401 | 401 | PASS |
| AUTH-004 | Check for JWT issuer | Incorrect issuer JWT is rejected | GET /auth/me | JWT | 401 | 401 | PASS |
| AUTH-005 | Check for JWT audience | Incorrect JWT audience is rejected | GET /auth/me | JWT | 401 | 401 | PASS |
| AUTH-006 | Check for JWT subject | JWT wihtout subject is rejected | GET /auth/me | JWT | 401 | 401 | PASS |
| AUTH-007 | Check for JWT role | JWT with invalid role is rejected | GET /auth/me | JWT | 401 | 401 | PASS |
| AUTH-008 | Check for JWT organization | JWT with invalid organization ID is rejected | GET /auth/me | JWT | 401 | 401 | PASS |
| AUTH-009 | Check for JWT algorithm | Non HS384 algorithm based JWT is rejected | GET /auth/me | JWT | 401 | 401 | PASS |
| AUTH-010 | Check for failed login rate limiting | More than 5 wrong logins fail | GET /auth/login | JWT | 401,429 | 401, 401, 401, 429, 429, 429, 429 | PASS |
| AUTH-011 | Check for JWT secret strength | JWT secret should not not guessed and used to login | POST /users | JWT | 401 | 401 | PASS |
| AUTH-012 | Check JWT for a deleted user | JWT of a deleted user is invalid | GET /auth/me | JWT | 401 | 401 | PASS |
| BOLA-001 | Current tenant project access | Alice should be able to access her own project | GET /api/projects/221 | Alice's JWT + Alice's project ID | 200 | 200 | PASS |
| BOLA-002 | Current tenant document access | Alice should be able to access her own document | GET /api/documents/5 | Alice's JWT + Alice's document ID | 200 | 200 | PASS |
| BOLA-003 | Cross-tenant project access | Cross-tenant access is rejected | GET /api/projects/222 | Alice's JWT + Bob's project ID | 404 | 404 | PASS |
| BOLA-004 | Cross-tenant document access | Cross-tenant access is rejected | GET /api/documents/6 | Alice's JWT + Bob's document ID | 404 | 404 | PASS |
| BOLA-005 | Current tenant project access | Alice should be able to see her organisation's projects only | GET /api/projects/ | Alice's JWT + All org project IDs | 200 | 200 | PASS |
| BOLA-006 | Current tenant document access | Alice should be able to see her organisation's documents only | GET /api/documents/ | Alice's JWT + All org document IDs | 200 | 200 | PASS |
| ERR-001 | Unknown API route returns 404 + not found error | Unknown routes should return HTTP 404 with error "Not Found". | N/A /route-that-does-not-exist-1793698374387 | N/A | 404 | 404 | PASS |
| ERR-002 | Health endpoint does not expose internal errors | Health endpoint should report the application status without exposing stack traces or SQL queries. | N/A /health | N/A | 200 or 503 | 200 | PASS |
| ERR-003 | Unknown routes do not expose stack traces | Unknown routes should return 404 without exposing stack traces or internal file paths. | N/A /unknown-1793698374398 | N/A | 404 | 404 | PASS |
| ERR-004 | CORS allows the configured frontend origin | CORS should allow the configured frontend origin http://localhost:5174. | N/A /api/health | Origin: http://localhost:5174 | 200 | 200 | PASS |
| ERR-005 | CORS does not allow an untrusted origin | CORS should not return an allow-origin header for an untrusted origin. | N/A /api/health | Origin: http://evil.example | 200 | 200 | PASS |
| ERR-007 | Secure backend disables caching of API responses | Secure API responses should include private and no-store cache directives. | N/A /api/health | N/A | 200 | 200 | PASS |
| INPV-001 | Create document with empty title | Document creation with empty title is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-002 | Create document with non string title | Document creation with non-string title is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-003 | Create document with long title | Document creation with title over 200 chars is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-004 | Create document with 200 char title | Document creation title upto 200 char is allowed | POST /api/documents/ | Login JWT + project ID | 201 | 201 | PASS |
| INPV-005 | Create document with non string content | Document creation with non string content is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-006 | Create document with long content | Document creation with over 20,000 char is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-007 | Create document with 20,000 char content | Document creation content upto 20,000 is allowed | POST /api/documents/ | Login JWT + project ID | 201 | 201 | PASS |
| INPV-008 | Create document with invalid ID | Document creation with invalid project ID is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-009 | Create project with empty name | Project creation with empty name is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-010 | Create project with non string name | Project creation with non string name is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-011 | Create project with long name | Project creation with name over 150 chars is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-012 | Create project with 150 char name | Project creation with name upto 150 chars is allowed | POST /api/projects/ | Login JWT + project payload | 201 | 201 | PASS |
| INPV-013 | Create project with non string description | Project creation with non string description is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-014 | Create project with long description | Project creation with description over 5,000 chars is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-015 | Create project with 5,000 char description | Project creation with description upto 5,000 char is allowed | POST /api/projects/ | Login JWT + project payload | 201 | 201 | PASS |
| INPV-016 | Create project with missing name | Project creation with missing name is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-017 | Create project with missing description | Project creation with missing description is allowed | POST /api/projects/ | Login JWT + project payload | 201 | 201 | PASS |
| LP-001 | Client-supplied administrator role | User should have role - user | POST /api/users | Admin creates a user with role: admin | 201 | 201 | PASS |
| LP-002 | Admin project deletion | Admin should be allowed to delete a project | DELETE /api/projects/223 | Admin JWT + project ID | 200 | 200 | PASS |
| LP-003 | User project deletion | Normal user must be forbidden from deleting projects | DELETE /api/projects/224 | User JWT + project ID | 403 | 403 | PASS |
| PS-001 | Check password is hashed | Password should be hashed before storing in database | POST /auth/register | New user password | 201 | 201 | PASS |
| PS-002 | Check for SQL injection | Email should be sanitised before processing | POST /auth/login | SQL in email field | 401 | 401 | PASS |

## Detailed Results

### AUTH-001 — Check for missing JWT

- **Category:** Authentication
- **Input:** N/A
- **Expected behavior:** Missing JWT is rejected
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### AUTH-002 — Check for tampered JWT

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** Modified JWT is rejected
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### AUTH-003 — Check for expired JWT

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** Expired JWT is rejected
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### AUTH-004 — Check for JWT issuer

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** Incorrect issuer JWT is rejected
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### AUTH-005 — Check for JWT audience

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** Incorrect JWT audience is rejected
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### AUTH-006 — Check for JWT subject

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** JWT wihtout subject is rejected
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### AUTH-007 — Check for JWT role

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** JWT with invalid role is rejected
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### AUTH-008 — Check for JWT organization

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** JWT with invalid organization ID is rejected
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### AUTH-009 — Check for JWT algorithm

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** Non HS384 algorithm based JWT is rejected
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### AUTH-010 — Check for failed login rate limiting

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** More than 5 wrong logins fail
- **Actual behavior:** HTTP 401,401,401,429,429,429,429
- **Expected HTTP status:** 401,429
- **Actual HTTP status:** 401, 401, 401, 429, 429, 429, 429
- **Result:** PASS

### AUTH-011 — Check for JWT secret strength

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** JWT secret should not not guessed and used to login
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### AUTH-012 — Check JWT for a deleted user

- **Category:** Authentication
- **Input:** JWT
- **Expected behavior:** JWT of a deleted user is invalid
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS

### BOLA-001 — Current tenant project access

- **Category:** BOLA
- **Input:** Alice's JWT + Alice's project ID
- **Expected behavior:** Alice should be able to access her own project
- **Actual behavior:** HTTP 200
- **Expected HTTP status:** 200
- **Actual HTTP status:** 200
- **Result:** PASS

### BOLA-002 — Current tenant document access

- **Category:** BOLA
- **Input:** Alice's JWT + Alice's document ID
- **Expected behavior:** Alice should be able to access her own document
- **Actual behavior:** HTTP 200
- **Expected HTTP status:** 200
- **Actual HTTP status:** 200
- **Result:** PASS

### BOLA-003 — Cross-tenant project access

- **Category:** BOLA
- **Input:** Alice's JWT + Bob's project ID
- **Expected behavior:** Cross-tenant access is rejected
- **Actual behavior:** HTTP 404
- **Expected HTTP status:** 404
- **Actual HTTP status:** 404
- **Result:** PASS

### BOLA-004 — Cross-tenant document access

- **Category:** BOLA
- **Input:** Alice's JWT + Bob's document ID
- **Expected behavior:** Cross-tenant access is rejected
- **Actual behavior:** HTTP 404
- **Expected HTTP status:** 404
- **Actual HTTP status:** 404
- **Result:** PASS

### BOLA-005 — Current tenant project access

- **Category:** BOLA
- **Input:** Alice's JWT + All org project IDs
- **Expected behavior:** Alice should be able to see her organisation's projects only
- **Actual behavior:** HTTP 200
- **Expected HTTP status:** 200
- **Actual HTTP status:** 200
- **Result:** PASS

### BOLA-006 — Current tenant document access

- **Category:** BOLA
- **Input:** Alice's JWT + All org document IDs
- **Expected behavior:** Alice should be able to see her organisation's documents only
- **Actual behavior:** HTTP 200
- **Expected HTTP status:** 200
- **Actual HTTP status:** 200
- **Result:** PASS

### ERR-001 — Unknown API route returns 404 + not found error

- **Category:** Error handling
- **Input:** N/A
- **Expected behavior:** Unknown routes should return HTTP 404 with error "Not Found".
- **Actual behavior:** HTTP 404, Response: {"error":"Not Found"}
- **Expected HTTP status:** 404
- **Actual HTTP status:** 404
- **Result:** PASS

### ERR-002 — Health endpoint does not expose internal errors

- **Category:** Error handling
- **Input:** N/A
- **Expected behavior:** Health endpoint should report the application status without exposing stack traces or SQL queries.
- **Actual behavior:** HTTP 200, Response: {"status":"ok","database":"connected"}
- **Expected HTTP status:** 200 or 503
- **Actual HTTP status:** 200
- **Result:** PASS

### ERR-003 — Unknown routes do not expose stack traces

- **Category:** Error handling
- **Input:** N/A
- **Expected behavior:** Unknown routes should return 404 without exposing stack traces or internal file paths.
- **Actual behavior:** HTTP 404, Response: {"error":"Not Found"}
- **Expected HTTP status:** 404
- **Actual HTTP status:** 404
- **Result:** PASS

### ERR-004 — CORS allows the configured frontend origin

- **Category:** Error handling
- **Input:** Origin: http://localhost:5174
- **Expected behavior:** CORS should allow the configured frontend origin http://localhost:5174.
- **Actual behavior:** HTTP 200, Access-Control-Allow-Origin: http://localhost:5174
- **Expected HTTP status:** 200
- **Actual HTTP status:** 200
- **Result:** PASS

### ERR-005 — CORS does not allow an untrusted origin

- **Category:** Error handling
- **Input:** Origin: http://evil.example
- **Expected behavior:** CORS should not return an allow-origin header for an untrusted origin.
- **Actual behavior:** HTTP 200, Access-Control-Allow-Origin: null
- **Expected HTTP status:** 200
- **Actual HTTP status:** 200
- **Result:** PASS

### ERR-007 — Secure backend disables caching of API responses

- **Category:** Error handling
- **Input:** N/A
- **Expected behavior:** Secure API responses should include private and no-store cache directives.
- **Actual behavior:** HTTP 200, Cache-Control: no-store, no-cache, must-revalidate, private
- **Expected HTTP status:** 200
- **Actual HTTP status:** 200
- **Result:** PASS

### INPV-001 — Create document with empty title

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with empty title is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-002 — Create document with non string title

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with non-string title is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-003 — Create document with long title

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with title over 200 chars is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-004 — Create document with 200 char title

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation title upto 200 char is allowed
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS

### INPV-005 — Create document with non string content

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with non string content is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-006 — Create document with long content

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with over 20,000 char is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-007 — Create document with 20,000 char content

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation content upto 20,000 is allowed
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS

### INPV-008 — Create document with invalid ID

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with invalid project ID is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-009 — Create project with empty name

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with empty name is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-010 — Create project with non string name

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with non string name is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-011 — Create project with long name

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with name over 150 chars is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-012 — Create project with 150 char name

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with name upto 150 chars is allowed
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS

### INPV-013 — Create project with non string description

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with non string description is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-014 — Create project with long description

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with description over 5,000 chars is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-015 — Create project with 5,000 char description

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with description upto 5,000 char is allowed
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS

### INPV-016 — Create project with missing name

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with missing name is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-017 — Create project with missing description

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with missing description is allowed
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS

### LP-001 — Client-supplied administrator role

- **Category:** Least privilege
- **Input:** Admin creates a user with role: admin
- **Expected behavior:** User should have role - user
- **Actual behavior:** HTTP 201, User Role - user
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS

### LP-002 — Admin project deletion

- **Category:** Least privilege
- **Input:** Admin JWT + project ID
- **Expected behavior:** Admin should be allowed to delete a project
- **Actual behavior:** HTTP 200
- **Expected HTTP status:** 200
- **Actual HTTP status:** 200
- **Result:** PASS

### LP-003 — User project deletion

- **Category:** Least privilege
- **Input:** User JWT + project ID
- **Expected behavior:** Normal user must be forbidden from deleting projects
- **Actual behavior:** HTTP 403
- **Expected HTTP status:** 403
- **Actual HTTP status:** 403
- **Result:** PASS

### PS-001 — Check password is hashed

- **Category:** Password Security
- **Input:** New user password
- **Expected behavior:** Password should be hashed before storing in database
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS

### PS-002 — Check for SQL injection

- **Category:** Password Security
- **Input:** SQL in email field
- **Expected behavior:** Email should be sanitised before processing
- **Actual behavior:** HTTP 401
- **Expected HTTP status:** 401
- **Actual HTTP status:** 401
- **Result:** PASS
