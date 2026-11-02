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


./tests/run-security-tests.sh both

======================================
 Running security tests: vulnerable
======================================
✔ client-supplied administrator role is ignored during user creation (1835.276575ms)
✔ Missing JWT is rejected (216.904044ms)
✔ Malformed JWT is rejected (292.450529ms)
✔ Tampered JWT signature is rejected (1463.07598ms)
✔ Expired JWT is rejected (104.051577ms)
✔ JWT with incorrect issuer is rejected (205.888704ms)
✔ JWT with incorrect audience is rejected (99.972083ms)
Login attempt statuses: [
  401, 401, 401,
  401, 401, 401,
  401
]
✔ repeated failed login attempts are rate limited correctly (49.279461ms)
✔ weak JWT secret cannot be used to forge an administrator token (676.042709ms)
▶ project deletion authorization
  ✔ administrator can delete a project (11.127444ms)
✔ project deletion authorization (2603.026319ms)
▶ BOLA security tests — vulnerable application
  ✔ allows Alice to access her own project (308.563342ms)
  ✔ allows Alice to access her own document (14.176072ms)
  ✔ allows Alice to access Bob's project (4.84994ms)
  ✔ allows Alice to access Bob's document (6.757545ms)
  ✔ does not show Bob's project in Alice's project list (8.031041ms)
  ✔ does not show Bob's document in Alice's document list (7.001606ms)
✔ BOLA security tests — vulnerable application (3153.058202ms)
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3286.82092

======================================
 Running security tests: secure
======================================
✔ client-supplied administrator role is ignored during user creation (2051.361406ms)
✔ Missing JWT is rejected (233.449786ms)
✔ Malformed JWT is rejected (393.17004ms)
✔ Tampered JWT signature is rejected (1280.308751ms)
✔ Expired JWT is rejected (109.58077ms)
✔ JWT with incorrect issuer is rejected (88.534272ms)
✔ JWT with incorrect audience is rejected (206.203723ms)
Login attempt statuses: [
  401, 401, 401,
  401, 429, 429,
  429
]
✔ repeated failed login attempts are rate limited correctly (135.055152ms)
✔ weak JWT secret cannot be used to forge an administrator token (319.120531ms)
▶ project deletion authorization
  ✔ administrator can delete a project (14.326353ms)
✔ project deletion authorization (2491.033348ms)
▶ BOLA security tests — secure application
  ✔ allows Alice to access her own project (8.253941ms)
  ✔ allows Alice to access her own document (5.935038ms)
  ✔ blocks Alice from accessing Bob's project (4.354968ms)
  ✔ blocks Alice from accessing Bob's document (4.280798ms)
  ✔ does not show Bob's project in Alice's project list (5.053375ms)
  ✔ does not show Bob's document in Alice's document list (4.923137ms)
✔ BOLA security tests — secure application (2814.464074ms)
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2943.172774

All requested security test suites passed.


Security test	Vulnerable app	Secure app
Cross-tenant project access	Allowed	Blocked
Cross-tenant document access	Allowed	Blocked
Own project/document access	Allowed	Allowed
Normal user deletes project	Allowed	Blocked
Admin deletes project	Allowed	Allowed
Client-supplied admin role	Accepted	Ignored
Invalid JWT	Rejected	Rejected
Weak JWT secret	Forgery possible	Protected
Repeated failed logins	Rate limiting behavior	Rate limited