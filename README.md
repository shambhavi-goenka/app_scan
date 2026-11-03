# SecureSaaS — Multi-Tenant Application Security Assessment

## 1. Project Overview

SecureSaaS is a security-focused project that evaluates application security controls in a multi-tenant SaaS environment.

The project contains two implementations of the same application:

- **Vulnerable application:** intentionally demonstrates selected application security weaknesses.
- **Secure application:** implements security controls intended to mitigate those weaknesses.

The primary objective is to demonstrate how application-level security weaknesses can affect tenant isolation, authentication and authorization, and how automated security testing can help verify remediation.

The project combines application development, security regression testing, a custom Node.js scanner, dependency auditing, dynamic application security testing and CI/CD security automation.

## 2. Key Security Areas

The project focuses on:

- Broken Object Level Authorization (BOLA)
- Multi-tenant data isolation
- Authentication and JWT validation
- Role-based and least-privilege authorization
- Password security
- Session security
- SQL injection prevention
- Input validation
- Error handling
- Security-event logging
- Dependency and supply-chain security
- CI/CD security checks

## 3. Application Architecture

The repository contains two independent application implementations, a shared security test suite and a custom scanner.

```text
app_scan/
├── apps/
│   ├── vulnerable-app/
│   │   ├── backend/
│   │   └── frontend/
│   └── secure-app/
│       ├── backend/
│       └── frontend/
├── scanner/
│   ├── src/
│   └── reports/
├── tests/
│   └── security/
├── infrastructure/
│   └── database/
├── docs/
│   ├── threat-model.md
│   └── security-testing.md
└── .github/
    ├── workflows/
    └── dependabot.yml
```

### Application endpoints

| Component | Address |
|---|---|
| Vulnerable frontend | `http://localhost:5173` |
| Secure frontend | `http://localhost:5174` |
| Vulnerable backend API | `http://127.0.0.1:3001/api` |
| Secure backend API | `http://127.0.0.1:3002/api` |
| MySQL host port | `3307` |

Both backends use MySQL. Each frontend communicates with its corresponding backend.

## 4. Security Testing Approach

The project uses a shared automated security test suite to evaluate both implementations.

The tests cover:

- Cross-tenant project and document access
- Authentication and JWT validation
- Login rate limiting
- Least-privilege authorization
- Client-controlled role assignment
- Password and session security
- SQL injection and input validation
- Error handling

The tests create separate organizations and attempt operations across tenant boundaries. This makes it possible to compare the behavior of the vulnerable and secure implementations under equivalent test scenarios.

### Run the security tests

Run both implementations:

```bash
./tests/run-security-tests.sh both
```

Run individually:

```bash
./tests/run-security-tests.sh vulnerable
./tests/run-security-tests.sh secure
```

## 5. Custom Security Scanner

A custom Node.js scanner is included to execute the selected security regression tests and generate Markdown reports.

### Scanner commands

Run against the vulnerable application:

```bash
cd scanner
npm run scan -- --target vulnerable
```

Run against the secure application:

```bash
npm run scan -- --target secure
```

Run against both:

```bash
npm run scan -- --target both
```

Generated reports:

- `scanner/reports/vulnerable-report.md`
- `scanner/reports/secure-report.md`

The scanner provides a repeatable way to execute the selected security tests and compare the results. Its findings are limited to the tests it runs and should not be interpreted as a complete vulnerability assessment.

## 6. Vulnerable vs. Secure Results

The recorded security regression test run produced the following results:
(refer to the reports for more detaisl on the tests and scans)

| Security scenario | Vulnerable application | Secure application |
|---|---|---|
| User accesses own project | Allowed | Allowed |
| User accesses own document | Allowed | Allowed |
| Cross-tenant project access | Allowed | Blocked |
| Cross-tenant document access | Allowed | Blocked |
| Cross-tenant data in project listing | Not returned | Not returned |
| Cross-tenant data in document listing | Not returned | Not returned |
| Client-supplied administrator role | Allowed | Ignored |
| Invalid JWT | Rejected | Rejected |
| Repeated failed login attempts | Rate limiting behavior observed | Requests rate-limited |
| Normal user project deletion | Allowed | Blocked |
| Administrator project deletion | Allowed | Allowed |

**Recorded test execution:** 18 tests passed and 0 failed for each implementation.

The results demonstrate that the secure implementation blocks the tested cross-tenant project and document access attempts while preserving access to the user's own resources.

The vulnerable implementation demonstrates the selected authorization weaknesses. Other controls, such as JWT rejection, are also exercised in both implementations.

### Interpreting scanner results

The custom scanner's reports should be compared by looking at:

1. Which test cases passed or failed.
2. Whether cross-tenant access was allowed or blocked.
3. Whether unauthorized administrative operations were rejected.
4. Whether authentication and input-validation checks behaved as expected.

A successful test run means the selected test assertions passed. It does not mean that the application contains no vulnerabilities.

## 7. Dependency and Supply-Chain Security

Dependency auditing is performed using npm.

```bash
npm audit --audit-level=high
```

The audit covers six dependency projects:

- Root project
- Test suite
- Vulnerable backend and frontend
- Secure backend and frontend

At the time of the latest verification, all six projects reported zero dependency vulnerabilities.

Dependabot is configured to check for dependency updates weekly.

## 8. Dynamic Application Security Testing

OWASP ZAP was used to assess both application implementations.

The reviewed secure backend report contained:

- No high-risk alerts
- No medium-risk alerts
- No low-risk alerts
- One informational alert concerning non-storable content

The vulnerable and secure ZAP reports were also reviewed and had similar results.

ZAP findings are interpreted alongside the automated security regression tests. Dynamic scanning does not independently establish complete tenant isolation or authorization correctness.

The original reports are retained under `scanner/reports/OWASP ZAP reports/`.

## 9. CI/CD Security

GitHub Actions is used to automate security checks.

The workflows include:

- Dependency auditing
- Application startup and health checks
- Security regression scanning
- Security report generation and artifact upload
- Repository secret scanning using Gitleaks

This provides repeatable security checks as part of the development workflow.

## 10. Security Logging

Both implementations include structured JSON security-event logging for authentication and authorization-related events.

The current logger writes to standard output. Persistent storage, centralized monitoring and tamper-resistant audit logging are outside the current implementation scope.

## 11. Documentation

Further project details are available in:

- [`docs/threat-model.md`](docs/threat-model.md) — assets, trust boundaries, STRIDE threats and security controls.
- [`docs/security-testing.md`](docs/security-testing.md) — test methodology, execution instructions, results, scanner, dependency auditing, ZAP and limitations.

## 12. Limitations

- This project is a demonstration environment, not a production-ready SaaS deployment.
- The scanner executes a defined set of security regression tests and is not a general-purpose vulnerability scanner.
- Automated tests cover selected scenarios and cannot guarantee the absence of vulnerabilities.
- ZAP results depend on endpoint coverage and scan configuration.
- Persistent audit storage, centralized monitoring and production infrastructure hardening are outside the current scope.

## 13. Project Objective

SecureSaaS demonstrates a practical application security workflow:

1. Identify security threats in a multi-tenant application.
2. Demonstrate selected weaknesses in a vulnerable implementation.
3. Implement controls in a secure implementation.
4. Validate behavior using automated security regression tests.
5. Compare results through a custom scanner.
6. Assess dependencies and application behavior using additional security tools.
7. Integrate security checks into CI/CD workflows.

The project demonstrates the application of security engineering principles through implementation, testing, comparison and documentation.