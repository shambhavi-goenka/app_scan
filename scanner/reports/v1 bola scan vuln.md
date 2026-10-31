# SecureSaaS Security Scan Report

- **Target:** http://127.0.0.1:3001/api
- **Scanned at:** 2026-10-31T09:01:06.214Z
- **Checks performed:** 2
- **Vulnerabilities found:** 2
- **Overall result:** VULNERABLE

## Findings

### BOLA-001 — Cross-tenant project access

- **Severity:** High
- **Status:** VULNERABLE
- **Endpoint:** GET /api/projects/16
- **HTTP status:** 200
- **Evidence:** Alice successfully retrieved a project belonging to Bob's organization.
- **Remediation:** Scope project lookups by both project ID and the authenticated user's organization ID.

### BOLA-002 — Cross-tenant document access

- **Severity:** High
- **Status:** VULNERABLE
- **Endpoint:** GET /api/documents/11
- **HTTP status:** 200
- **Evidence:** Alice successfully retrieved a document belonging to Bob's organization.
- **Remediation:** Scope document lookups by both document ID and the authenticated user's organization ID.

## Scope and limitations

This scan tests the listed cross-tenant authorization scenarios only.
A passing result does not establish that the entire application is secure.
