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

## Application functionality and API scope

### Frontend functionality
The current frontend supports:
- Organization registration and login
- Project creation and listing
- Opening projects
- Document creation, listing, and viewing
- Logout

### Backend-only API capabilities
The backend also exposes:
- Project deletion (administrator-only in the secure application)
- Document editing
- Document deletion (administrator-only)
- User creation (administrator-only in the secure application)

These endpoints are tested directly through HTTP requests, independently
of the frontend. A feature does not need a visible UI control to require
server-side authorization.

### Security testing scope
The security tests validate:
- Authentication and JWT validation
- Login rate limiting
- Cross-tenant project and document access
- Administrator-only operations
- Client-controlled role assignment
- Weak JWT secret exploitation in the deliberately vulnerable lab