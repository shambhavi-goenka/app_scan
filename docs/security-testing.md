# SecureSaaS — Security Testing and Assessment

## 1. Objective and Overview

This project evaluates security controls in a multi-tenant SaaS application, with particular focus on tenant isolation and authorization.

It compares two implementations:

- **Vulnerable application:** intentionally contains selected security weaknesses for demonstration and testing.
- **Secure application:** implements controls intended to mitigate those weaknesses.

Testing combines automated security regression tests, a custom Node.js scanner, dependency auditing, CI workflows and OWASP ZAP.

The assessment provides evidence about the controls tested. It is not a guarantee that either application is free from vulnerabilities.

## 2. Application Scope

### Frontend functionality

The frontend supports:

- Organization registration and login
- Project creation and listing
- Opening projects
- Document creation, listing and viewing
- Logout

### Backend API capabilities

The backend also exposes operations that are tested directly through HTTP requests, independently of the frontend:

- Project deletion
- Document editing and deletion
- User creation

Some operations require administrator privileges in the secure implementation. A feature does not need a visible frontend control to require server-side authorization.

## 3. Security Testing Scope

The automated security tests cover:

- Broken Object Level Authorization (BOLA)
- Cross-tenant project and document access
- Least-privilege authorization
- Authentication and JWT validation
- Login rate limiting
- Password security
- Session security
- SQL injection
- Input validation
- Error handling
- Client-controlled role assignment
- Administrator-only operations

The deliberately vulnerable lab also includes scenarios involving weak JWT secrets. Test results should be interpreted according to the specific assertions in each test, rather than assuming that every test demonstrates a vulnerability in both implementations.

## 4. Security Regression Testing

The tests create separate organizations and attempt cross-tenant resource access. They compare the behavior of the vulnerable and secure implementations.

Run both implementations:

```bash
./tests/run-security-tests.sh both
```

Run one implementation:

```bash
./tests/run-security-tests.sh vulnerable
./tests/run-security-tests.sh secure
```

## 5. Custom Security Scanner

The project includes a Node.js scanner that runs the security test suite against the selected implementation and generates Markdown reports.

Run:

```bash
npm run scan -- --target vulnerable
npm run scan -- --target secure
npm run scan -- --target both
```

Generated reports:

- `scanner/reports/vulnerable-report.md`
- `scanner/reports/secure-report.md`

The scanner orchestrates the selected test files and records their results. Its coverage is limited to the tests it runs; it is not a general-purpose vulnerability scanner.

## 6. Dependency Security

Dependency auditing is performed using npm:

```bash
npm audit --audit-level=high
```

The audit covers six dependency projects:

- Root project
- Test suite
- Vulnerable backend
- Vulnerable frontend
- Secure backend
- Secure frontend

At the time of the latest project verification, all six audited dependency projects reported zero vulnerabilities.

Dependabot is configured to check for dependency updates weekly.

## 7. Dynamic Application Security Testing

OWASP ZAP was used to assess both application implementations.

```bash
chmod +x scanner/run-zap-baseline.sh
./scanner/run-zap-baseline.sh
```

The reports were reviewed for:

- Security headers and configuration
- Information disclosure
- HTTP response behavior
- Potential application security weaknesses

The reviewed secure backend report contained no high-, medium- or low-risk alerts and one informational alert concerning non-storable content.

The vulnerable and secure reports were also reviewed and found to have similar results. Automated ZAP findings should be interpreted alongside the manual and automated regression tests. Similar scan results do not establish equivalent authorization behavior or prove complete tenant isolation.

The original ZAP HTML reports are retained under `docs/security-reports/`.

## 8. CI/CD Security

GitHub Actions automates:

- Dependency auditing
- Application startup and health checks
- Security regression scanning
- Security report artifact generation and upload

A separate Gitleaks workflow scans the repository for exposed secrets.

## 9. Security Logging

Both application implementations include structured JSON security logging for authentication events. Authorization-denial events are also included in the logging implementation.

The current logger writes to standard output. It is not a persistent or tamper-resistant audit logging system.

## 10. Limitations

- This is a demonstration environment, not a production SaaS deployment.
- Automated tests cover selected scenarios and cannot identify every application security weakness.
- The custom scanner runs a defined set of regression tests; it does not replace a comprehensive security assessment.
- ZAP results depend on the endpoints and authentication coverage available during scanning.
- Persistent audit storage, alerting and centralized log management are outside the current implementation scope.
- The results represent the application state and test runs at the time of assessment.

## 11. Overall Assessment

The project demonstrates a comparative application security assessment using vulnerable and hardened implementations.

It combines tenant-isolation testing, authorization and authentication regression tests, a custom test runner, dependency auditing, dynamic scanning, security logging and CI integration.

The recorded tests demonstrate that the secure implementation blocks the tested cross-tenant project and document access attempts while preserving access to the user's own resources. These results are evidence for the tested scenarios, not a guarantee that the application is free from vulnerabilities.