# vulnerable Security Scan Report

## Summary

- **Target:** vulnerable
- **Tests recorded:** 17
- **Passed:** 15
- **Failed:** 2

## Test Results

| ID | Test | Description | Request | Input | Expected HTTP | Actual HTTP | Result |
|---|---|---|---|---|---:|---:|---|
| INPV-001 | Create document with empty title | Document creation with empty title is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-002 | Create document with non string title | Document creation with non-string title is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 201 | FAIL |
| INPV-003 | Create document with long title | Document creation with title over 200 chars is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-004 | Create document with 200 char title | Document creation title upto 200 char is allowed | POST /api/documents/ | Login JWT + project ID | 201 | 201 | PASS |
| INPV-005 | Create document with non string content | Document creation with non string content is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-006 | Create document with long content | Document creation with over 20,000 char is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-007 | Create document with 20,000 char content | Document creation content upto 20,000 is allowed | POST /api/documents/ | Login JWT + project ID | 400 | 201 | FAIL |
| INPV-008 | Create document with invalid ID | Document creation with invalid project ID is forbidden | POST /api/documents/ | Login JWT + project ID | 400 | 400 | PASS |
| INPV-009 | Create project with empty name | Project creation with empty name is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-010 | Create project with non string name | Project creation with non string name is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-011 | Create project with long name | Project creation with name over 150 chars is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-012 | Create project with 150 char name | Project creation with name upto 150 chars is allowed | POST /api/projects/ | Login JWT + project payload | 201 | 201 | PASS |
| INPV-013 | Create project with non string description | Project creation with non string description is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-014 | Create project with long description | Project creation with description over 5,000 chars is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-015 | Create project with 5,000 char description | Project creation with description upto 5,000 char is allowed | POST /api/projects/ | Login JWT + project payload | 201 | 201 | PASS |
| INPV-016 | Create project with missing name | Project creation with missing name is forbidden | POST /api/projects/ | Login JWT + project payload | 400 | 400 | PASS |
| INPV-017 | Create project with missing description | Project creation with missing description is allowed | POST /api/projects/ | Login JWT + project payload | 201 | 201 | PASS |

## Detailed Results

### INPV-001 — Create document with empty title

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with empty title is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-002 — Create document with non string title

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with non-string title is forbidden
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 400
- **Actual HTTP status:** 201
- **Result:** FAIL

### INPV-003 — Create document with long title

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with title over 200 chars is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-004 — Create document with 200 char title

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation title upto 200 char is allowed
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS

### INPV-005 — Create document with non string content

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with non string content is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-006 — Create document with long content

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with over 20,000 char is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-007 — Create document with 20,000 char content

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation content upto 20,000 is allowed
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 400
- **Actual HTTP status:** 201
- **Result:** FAIL

### INPV-008 — Create document with invalid ID

- **Category:** Input validation
- **Input:** Login JWT + project ID
- **Expected behavior:** Document creation with invalid project ID is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-009 — Create project with empty name

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with empty name is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-010 — Create project with non string name

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with non string name is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-011 — Create project with long name

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with name over 150 chars is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-012 — Create project with 150 char name

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with name upto 150 chars is allowed
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS

### INPV-013 — Create project with non string description

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with non string description is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-014 — Create project with long description

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with description over 5,000 chars is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-015 — Create project with 5,000 char description

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with description upto 5,000 char is allowed
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS

### INPV-016 — Create project with missing name

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with missing name is forbidden
- **Actual behavior:** HTTP 400
- **Expected HTTP status:** 400
- **Actual HTTP status:** 400
- **Result:** PASS

### INPV-017 — Create project with missing description

- **Category:** Input validation
- **Input:** Login JWT + project payload
- **Expected behavior:** Project creation with missing description is allowed
- **Actual behavior:** HTTP 201
- **Expected HTTP status:** 201
- **Actual HTTP status:** 201
- **Result:** PASS
