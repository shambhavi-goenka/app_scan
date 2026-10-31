# Security Test Results

## Test environment

- Application: SecureSaaS vulnerable version
- Backend: Node.js / Express
- Database: MySQL
- Test runner: Node.js built-in test runner

## BOLA test cases

| Test | Expected vulnerable behavior |
|---|---|
| Alice accesses her own project | HTTP 200 |
| Alice accesses Bob's project | HTTP 200 — vulnerability |
| Alice accesses Bob's document | HTTP 200 — vulnerability |
| Alice lists projects | Bob's project is absent |
| Alice lists documents | Bob's document is absent |

## Security observations

The list endpoints apply organization-level filtering, but the individual
resource endpoints do not consistently enforce tenant ownership.

This creates an authorization bypass when an attacker knows or obtains
another tenant's resource ID.

## Remediation

The secure implementation must enforce organization ownership on every
resource lookup, not only on list operations.

## Verification

Run:

`node --test tests/security/bola.test.js`
`node --test tests/security/bola-secure.test.js`


## Vulnerable vs secure comparison

| Test | Vulnerable backend | Secure backend |
|---|---:|---:|
| Alice accesses her own project | 200 | 200 |
| Alice accesses Bob's project | 200 | 404 |
| Alice accesses Bob's document | 200 | 404 |
| Alice lists projects | Bob's project absent | Bob's project absent |
| Alice lists documents | Bob's document absent | Bob's document absent |

## Remediation

The secure backend scopes individual resource lookups by both
the requested resource ID and the authenticated user's organization ID.

Cross-tenant requests now return 404 instead of exposing another
organization's resources.