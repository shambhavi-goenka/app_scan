# SecureSaaS Security Scanner

## Purpose

A lightweight, application-specific security scanner that tests
tenant isolation in a multi-tenant SaaS application.

## Checks

- BOLA-001: Cross-tenant project access
- BOLA-002: Cross-tenant document access

## Methodology

1. Check API health.
2. Register two independent test organizations.
3. Create projects and documents.
4. Authenticate as the first organization.
5. Attempt to retrieve the second organization's resources.
6. Record HTTP status, evidence, severity and remediation.

## Usage

Run the vulnerable backend:

    npm run scan:vulnerable

Run the secure backend:

    npm run scan:secure

## Limitations

This is a targeted authorization scanner, not a general-purpose
DAST or vulnerability scanner.

It only checks the listed endpoints and test scenarios.
A passing result does not establish that the entire application is secure.

Run only against applications you own or are authorized to test.