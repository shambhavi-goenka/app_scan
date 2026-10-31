# SecureSaaS Security Findings

## Finding 001: Broken Object Level Authorization

- Application: Vulnerable application
- Endpoint: GET /api/projects/:id
- Category: OWASP API Security - API1: Broken Object Level Authorization
- Severity: High (provisional)
- Status: Confirmed in local lab

### Description

The endpoint retrieves projects using the project ID alone.

It does not verify that the requested project belongs to
the organization associated with the authenticated user.

### Reproduction

1. Register two separate organizations.
2. Create one project under each organization.
3. Authenticate as a user from Organization A.
4. Request a project belonging to Organization B.
5. Observe that the API returns the other organization's project.

### Expected secure behavior

The API should only return a project when its ID and
organization ID both match the authenticated user.

### Impact

An authenticated user may access confidential project
information belonging to another tenant.

### Remediation

Enforce tenant ownership in the database query and
return a not-found response for inaccessible projects.

### Verification

To be completed after implementing the secure application.


## Finding 002: Cross-Tenant Document Access

- Application: Vulnerable application
- Endpoint: GET /api/documents/:id
- Category: OWASP API1 - Broken Object Level Authorization
- Severity: High (provisional)
- Status: Confirmed in local lab

### Description

The endpoint retrieves a document by ID without verifying
that it belongs to the authenticated user's organization.

### Reproduction

1. Create two organizations.
2. Create a document under each organization.
3. Authenticate as a user from Organization A.
4. Request the document belonging to Organization B.
5. Observe that the document content is returned.

### Impact

Unauthorized disclosure of confidential documents
between tenants.

### Remediation

Include the authenticated organization ID in the
document lookup query.

### Verification

Pending implementation in the secure application.
