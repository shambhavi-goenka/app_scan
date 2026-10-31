# SecureSaaS Security Engineering Methodology

## Objective

Evaluate and improve tenant isolation in a multi-tenant SaaS application.

## Assets

- User accounts
- Organization records
- Project records
- Document contents
- Authentication tokens

## Trust boundaries

- Browser to API
- API to database
- One organization to another organization

## Threat scenarios

An authenticated user from Organization A attempts to access
resources belonging to Organization B.

## Security controls

- JWT authentication
- Organization-scoped database queries
- Parameterized SQL queries
- Server-side authorization checks
- Automated regression tests

## Validation

The security tests create two independent organizations and attempt
cross-tenant resource access.

The vulnerable implementation demonstrates unauthorized access.
The hardened implementation rejects cross-tenant requests.

## Limitations

The current scanner focuses on two BOLA scenarios.
It does not establish that authentication, session management,
injection resistance, deployment configuration or other controls
are secure.