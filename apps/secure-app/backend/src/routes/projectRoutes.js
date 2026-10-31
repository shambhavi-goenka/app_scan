import { Router } from "express";
import pool from "../config/database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// All project routes require authentication.
router.use(authenticateToken);

// CREATE PROJECT
router.post("/", async (req, res) => {
  const { name, description = "" } = req.body;

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 150 ||
    typeof description !== "string" ||
    description.length > 5000
  ) {
    return res.status(400).json({
      error: "Invalid project details"
    });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO projects
       (organization_id, created_by, name, description)
       VALUES (?, ?, ?, ?)`,
      [
        req.user.organizationId,
        req.user.id,
        name.trim(),
        description
      ]
    );

    return res.status(201).json({
      message: "Project created",
      project: {
        id: result.insertId,
        name: name.trim(),
        description,
        organizationId: req.user.organizationId
      }
    });
  } catch (error) {
    console.error("Project creation failed:", error.message);

    return res.status(500).json({
      error: "Unable to create project"
    });
  }
});

// LIST PROJECTS BELONGING TO THE LOGGED-IN TENANT
router.get("/", async (req, res) => {
  try {
    const [projects] = await pool.execute(
      `SELECT id, name, description, created_by, created_at
       FROM projects
       WHERE organization_id = ?
       ORDER BY created_at DESC`,
      [req.user.organizationId]
    );

    return res.json({ projects });
  } catch (error) {
    console.error("Project listing failed:", error.message);

    return res.status(500).json({
      error: "Unable to retrieve projects"
    });
  }
});

// GET PROJECT BY ID
// INTENTIONAL LAB VULNERABILITY:
// The query does not check organization_id.
// An authenticated user may access another tenant's project
// if they know or guess its ID.
// This endpoint is deliberately vulnerable for local testing.
router.get("/:id", async (req, res) => {
  const projectId = Number(req.params.id);

  if (!Number.isSafeInteger(projectId) || projectId < 1) {
    return res.status(400).json({
      error: "Invalid project ID"
    });
  }

  try {
    const [projects] = await pool.execute(
      `SELECT id, organization_id, name, description,
              created_by, created_at
       FROM projects
       WHERE id = ? AND organization_id = ?
       LIMIT 1`,
      [projectId, req.user.organizationId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        error: "Project not found"
      });
    }

    return res.json({
      project: projects[0]
    });
  } catch (error) {
    console.error("Project retrieval failed:", error.message);

    return res.status(500).json({
      error: "Unable to retrieve project"
    });
  }
});

// DELETE PROJECT
// This operation is tenant-scoped and administrator-only.
router.delete("/:id", async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Administrator access required"
    });
  }

  const projectId = Number(req.params.id);

  if (!Number.isSafeInteger(projectId) || projectId < 1) {
    return res.status(400).json({
      error: "Invalid project ID"
    });
  }

  try {
    const [result] = await pool.execute(
      `DELETE FROM projects
       WHERE id = ? AND organization_id = ?`,
      [projectId, req.user.organizationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Project not found"
      });
    }

    return res.json({
      message: "Project deleted"
    });
  } catch (error) {
    console.error("Project deletion failed:", error.message);

    return res.status(500).json({
      error: "Unable to delete project"
    });
  }
});

export default router;
