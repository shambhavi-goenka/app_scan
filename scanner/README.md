# SecureSaaS Security Scanner

## Overview

The scanner is designed to demonstrate practical application security testing, identify common vulnerabilities, collect evidence, and generate reports.

It combines automated API security tests with OWASP ZAP baseline scans to compare the security posture of vulnerable and secure application implementations.


## Components

### 1. Application-Specific Security Tests

The automated test suite checks security controls across the vulnerable and secure backends.

Key checks include:

- Broken Object Level Authorization
- Authentication and JWT validation
- Authorization and least privilege
- SQL injection
- Input validation
- Password security
- Error handling

### 2. OWASP ZAP Baseline Scans

OWASP ZAP is used to perform passive baseline security scans against four application targets:

| Target | URL |
|---|---|
| Vulnerable frontend | `http://host.docker.internal:5173` |
| Secure frontend | `http://host.docker.internal:5174` |
| Vulnerable backend | `http://host.docker.internal:3001/api/health` |
| Secure backend | `http://host.docker.internal:3002/api/health` |

Each scan generates a separate Markdown report.

## Methodology

### Application-Specific Security Testing

1. Check API health.
2. Register two independent test organizations.
3. Create projects and documents.
4. Authenticate as the first organization.
5. Attempt to access the second organization's resources.
6. Record HTTP status, evidence, severity, and remediation.
7. Compare results between vulnerable and secure implementations.

### OWASP ZAP Baseline Scanning

1. Start the vulnerable and secure application instances.
2. Run the ZAP baseline scanning script.
3. Scan both frontend applications.
4. Scan both backend health endpoints.
5. Generate separate Markdown reports.
6. Review and compare the findings.

## Result Summary


### Application-Specific Security Testing Results

| **ID** | **Test** | **Description** | **Request** | **Expected HTTP** | **Actual HTTP (vuln)** | **Actual HTTP (secure)** | **Result (vuln/secure)** |
|---|---|---|---|---:|---:|---:|---|
| AUTH-001 | Missing JWT | Missing JWT is rejected | GET /auth/me | 401 | 401 | 401 | PASS/PASS |
| AUTH-002 | Tampered JWT | Modified JWT is rejected | GET /auth/me | 401 | 401 | 401 | PASS/PASS |
| AUTH-003 | Expired JWT | Expired JWT is rejected | GET /auth/me | 401 | 401 | 401 | PASS/PASS |
| AUTH-004 | JWT issuer | Incorrect issuer JWT is rejected | GET /auth/me | 401 | 401 | 401 | PASS/PASS |
| AUTH-005 | JWT audience | Incorrect audience JWT is rejected | GET /auth/me | 401 | 401 | 401 | PASS/PASS |
| AUTH-006 | JWT subject | JWT without subject is rejected | GET /auth/me | 401 | 401 | 401 | PASS/PASS |
| AUTH-007 | JWT role | JWT with invalid role is rejected | GET /auth/me | 401 | 401 | 401 | PASS/PASS |
| AUTH-008 | JWT organization | JWT with invalid organization ID is rejected | GET /auth/me | 401 | 401 | 401 | PASS/PASS |
| AUTH-009 | JWT algorithm | HS384 JWT is rejected | GET /auth/me | 401 | 200 | 401 | FAIL/PASS |
| AUTH-010 | Failed login rate limiting | More than 5 failed login attempts are rate limited | POST /auth/login | 401, 429 | 401, 401, 401, 401, 401, 401, 401 | 401, 401, 401, 429, 429, 429, 429 | FAIL/PASS |
| AUTH-011 | JWT secret strength | Weak JWT secret must not allow administrator token forgery | POST /users | 401 | 201 | 401 | FAIL/PASS |
| AUTH-012 | Deleted user JWT | JWT belonging to a deleted user is rejected | GET /auth/me | 401 | 401 | 401 | PASS/PASS |
| BOLA-001 | Own project access | Alice can access her own project | GET /api/projects/{id} | 200 | 200 | 200 | PASS/PASS |
| BOLA-002 | Own document access | Alice can access her own document | GET /api/documents/{id} | 200 | 200 | 200 | PASS/PASS |
| BOLA-003 | Cross-tenant project access | Alice cannot access Bob's project | GET /api/projects/{id} | 404 | 200 | 404 | FAIL/PASS |
| BOLA-004 | Cross-tenant document access | Alice cannot access Bob's document | GET /api/documents/{id} | 404 | 200 | 404 | FAIL/PASS |
| BOLA-005 | Project listing isolation | Alice sees only her organization's projects | GET /api/projects/ | 200 | 200 | 200 | PASS/PASS |
| BOLA-006 | Document listing isolation | Alice sees only her organization's documents | GET /api/documents/ | 200 | 200 | 200 | PASS/PASS |
| ERR-001 | Unknown API route | Unknown route returns 404 and Not Found error | GET /route-that-does-not-exist | 404 | 404 | 404 | FAIL/PASS |
| ERR-002 | Health endpoint error handling | Health endpoint does not expose internal errors | GET /health | 200 or 503 | 200 | 200 | PASS/PASS |
| ERR-003 | Unknown route information disclosure | Unknown routes do not expose stack traces or internal paths | GET /unknown | 404 | 404 | 404 | PASS/PASS |
| ERR-004 | Allowed CORS origin | Configured frontend origin is allowed | GET /api/health | 200 | 200 | 200 | PASS/PASS |
| ERR-005 | Untrusted CORS origin | Untrusted origin is not allowed | GET /api/health | 200 | 200 | 200 | PASS/PASS |
| ERR-007 | API cache control | API responses include private and no-store directives | GET /api/health | 200 | N/A | 200 | N/A/PASS |
| INPV-001 | Empty document title | Empty document title is rejected | POST /api/documents/ | 400 | 400 | 400 | PASS/PASS |
| INPV-002 | Non-string document title | Non-string document title is rejected | POST /api/documents/ | 400 | 201 | 400 | FAIL/PASS |
| INPV-003 | Long document title | Document title over 200 characters is rejected | POST /api/documents/ | 400 | 400 | 400 | PASS/PASS |
| INPV-004 | Maximum document title | Document title up to 200 characters is accepted | POST /api/documents/ | 201 | 201 | 201 | PASS/PASS |
| INPV-005 | Non-string document content | Non-string document content is rejected | POST /api/documents/ | 400 | 400 | 400 | PASS/PASS |
| INPV-006 | Long document content | Document content over 20,000 characters is rejected | POST /api/documents/ | 400 | 400 | 400 | PASS/PASS |
| INPV-007 | Maximum document content | Document content up to 20,000 characters is accepted | POST /api/documents/ | 201 | 201 | 201 | PASS/PASS |
| INPV-008 | Invalid project ID | Invalid project ID is rejected during document creation | POST /api/documents/ | 400 | 400 | 400 | PASS/PASS |
| INPV-009 | Empty project name | Empty project name is rejected | POST /api/projects/ | 400 | 400 | 400 | PASS/PASS |
| INPV-010 | Non-string project name | Non-string project name is rejected | POST /api/projects/ | 400 | 400 | 400 | PASS/PASS |
| INPV-011 | Long project name | Project name over 150 characters is rejected | POST /api/projects/ | 400 | 400 | 400 | PASS/PASS |
| INPV-012 | Maximum project name | Project name up to 150 characters is accepted | POST /api/projects/ | 201 | 201 | 201 | PASS/PASS |
| INPV-013 | Non-string project description | Non-string project description is rejected | POST /api/projects/ | 400 | 400 | 400 | PASS/PASS |
| INPV-014 | Long project description | Project description over 5,000 characters is rejected | POST /api/projects/ | 400 | 400 | 400 | PASS/PASS |
| INPV-015 | Maximum project description | Project description up to 5,000 characters is accepted | POST /api/projects/ | 201 | 201 | 201 | PASS/PASS |
| INPV-016 | Missing project name | Missing project name is rejected | POST /api/projects/ | 400 | 400 | 400 | PASS/PASS |
| INPV-017 | Missing project description | Missing project description is allowed | POST /api/projects/ | 201 | 201 | 201 | PASS/PASS |
| LP-001 | Client-supplied administrator role | New user cannot assign themselves an administrator role | POST /api/users | 201 | 201 | 201 | FAIL/PASS |
| LP-002 | Admin project deletion | Administrator can delete a project | DELETE /api/projects/{id} | 200 | 200 | 200 | PASS/PASS |
| LP-003 | User project deletion | Normal user cannot delete a project | DELETE /api/projects/{id} | 403 | 200 | 403 | FAIL/PASS |
| PS-001 | Password hashing | Password is hashed before database storage | POST /auth/register | 201 | 201 | 201 | PASS/PASS |
| PS-002 | SQL injection | SQL injection through the email field is prevented | POST /auth/login | 401 | 200 | 401 | FAIL/PASS |



## Usage

### Application-Specific Scanner

Run the scanner against the vulnerable backend:

```bash
npm run scan -- --target vulnerable
```

Run the scanner against the secure backend:

```bash
npm run scan -- --target secure
```

Run against both implementations:

```bash
npm run scan -- --target both
```

### OWASP ZAP Baseline Scans

Ensure all four application targets are running.

From the project root, execute:

```bash
chmod +x scanner/run-baseline.sh
./scanner/run-baseline.sh
```

The script runs four independent ZAP baseline scans and generates timestamped Markdown reports.

## Reports

### Application-Specific Scanner Reports

Generated in:

```text
scanner/reports/
├── vulnerable-report.md
└── secure-report.md
```

### OWASP ZAP Reports

Generated in:

```text
scanner/reports/
├── vulnerable-frontend-<timestamp>.md
├── secure-frontend-<timestamp>.md
├── vulnerable-backend-<timestamp>.md
└── secure-backend-<timestamp>.md
```

## Tools and Technologies

- Node.js
- JavaScript
- OWASP ZAP
- Docker
- REST API testing
- Automated security testing

## Limitations

- The application-specific scanner tests only the implemented security checks and scenarios.
- OWASP ZAP baseline scans are passive scans and do not constitute comprehensive penetration testing.
- Backend ZAP scans currently target the API health endpoints and do not cover every API route.
- A passing scan does not establish that the entire application is secure.
- Findings require manual review to determine their actual security impact.

## Authorization

Run these security tests only against applications you own or have explicit authorization to test.