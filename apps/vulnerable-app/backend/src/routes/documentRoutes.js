
import { Router } from "express";
import pool from "../config/database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

// CREATE DOCUMENT
router.post("/", async (req, res) => {
  const { projectId, title, content = "" } = req.body;

  if (
    !Number.isSafeInteger(Number(projectId)) ||
    Number(projectId) < 1 ||
    title === undefined || title === null || //vulnerable cause no string check - had to insert string parse
    String(title).trim().length < 1 ||
    String(title).trim().length > 200 ||
    typeof content !== "string" ||
    content.length > 20000
  ) {
    return res.status(400).json({
      error: "Invalid document details"
    });
  }

  try {
    // Verify that the project belongs to the authenticated tenant.
    const [projects] = await pool.execute(
      `SELECT id FROM projects
       WHERE id = ? AND organization_id = ?
       LIMIT 1`,
      [Number(projectId), req.user.organizationId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        error: "Project not found"
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO documents
       (organization_id, project_id, created_by, title, content)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.organizationId,
        Number(projectId),
        req.user.id,
        String(title).trim(), // - had to insert string parse cause no string check vuln
        content
      ]
    );

    return res.status(201).json({
      message: "Document created",
      document: {
        id: result.insertId,
        projectId: Number(projectId),
        title: String(title).trim() // - had to insert string parse cause no string check vuln
      }
    });
  } catch (error) {
    console.error("Document creation failed:", error.message);

    return res.status(500).json({
      error: "Unable to create document"
    });
  }
});

// LIST DOCUMENTS FOR THE CURRENT TENANT
router.get("/", async (req, res) => {
  try {
    const [documents] = await pool.execute(
      `SELECT id, project_id, title, created_by, created_at
       FROM documents
       WHERE organization_id = ?
       ORDER BY created_at DESC`,
      [req.user.organizationId]
    );

    return res.json({ documents });
  } catch (error) {
    console.error("Document listing failed:", error.message);

    return res.status(500).json({
      error: "Unable to retrieve documents"
    });
  }
});

// GET DOCUMENT BY ID
// INTENTIONAL LAB VULNERABILITY:
// Missing organization_id condition.
// An authenticated user may retrieve another tenant's document.
router.get("/:id", async (req, res) => {
  const documentId = Number(req.params.id);

  if (!Number.isSafeInteger(documentId) || documentId < 1) {
    return res.status(400).json({
      error: "Invalid document ID"
    });
  }

  try {
    const [documents] = await pool.execute(
      `SELECT id, organization_id, project_id, title,
              content, created_by, created_at
       FROM documents
       WHERE id = ?
       LIMIT 1`,
      [documentId]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        error: "Document not found"
      });
    }

    return res.json({
      document: documents[0]
    });
  } catch (error) {
    console.error("Document retrieval failed:", error.message);

    return res.status(500).json({
      error: "Unable to retrieve document"
    });
  }
});

// UPDATE DOCUMENT
router.put("/:id", async (req, res) => {
  const documentId = Number(req.params.id);
  const { title, content } = req.body;

  if (
    !Number.isSafeInteger(documentId) ||
    documentId < 1 ||
    typeof title !== "string" ||
    title.trim().length < 1 ||
    title.trim().length > 200 ||
    typeof content !== "string" ||
    content.length > 20000
  ) {
    return res.status(400).json({
      error: "Invalid document details"
    });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE documents
       SET title = ?, content = ?
       WHERE id = ? AND organization_id = ?`,
      [
        title.trim(),
        content,
        documentId,
        req.user.organizationId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Document not found"
      });
    }

    return res.json({
      message: "Document updated"
    });
  } catch (error) {
    console.error("Document update failed:", error.message);

    return res.status(500).json({
      error: "Unable to update document"
    });
  }
});

// DELETE DOCUMENT
router.delete("/:id", async (req, res) => {
  // leave in hehe only admin can delete documents but user can delete project
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Administrator access required"
    });
  }

  const documentId = Number(req.params.id);

  if (!Number.isSafeInteger(documentId) || documentId < 1) {
    return res.status(400).json({
      error: "Invalid document ID"
    });
  }

  try {
    const [result] = await pool.execute(
      `DELETE FROM documents
       WHERE id = ? AND organization_id = ?`,
      [documentId, req.user.organizationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Document not found"
      });
    }

    return res.json({
      message: "Document deleted"
    });
  } catch (error) {
    console.error("Document deletion failed:", error.message);

    return res.status(500).json({
      error: "Unable to delete document"
    });
  }
});

export default router;
