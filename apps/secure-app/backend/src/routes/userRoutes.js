import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { logSecurityEvent } from "../securityLogger.js";

const router = Router();

router.use(authenticateToken);

// Only administrators can create users.
// New users are always assigned the "user" role.
router.post("/", async (req, res) => {
  if (req.user.role !== "admin") {
    await logSecurityEvent({
      event: "authorization.denied",
      outcome: "failure",
      userId: req.user.id,
      organizationId: req.user.organizationId,
      reason: "admin_role_required",
      resourceType: "user"
    });

    return res.status(403).json({
      error: "Administrator access required"
    });
  }

  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({ error: "Invalid user details" });
  }

  if (
    name.trim().length < 2 ||
    name.trim().length > 150 ||
    email.trim().length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    password.length < 12 ||
    password.length > 128
  ) {
    return res.status(400).json({ error: "Invalid user details" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users
       (organization_id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'user')`,
      [
        req.user.organizationId,
        name.trim(),
        email.trim().toLowerCase(),
        passwordHash
      ]
    );

    await logSecurityEvent({
      event: "user.create.success",
      outcome: "success",
      userId: req.user.id,
      organizationId: req.user.organizationId,
      resourceType: "user",
      resourceId: result.insertId
    });

    return res.status(201).json({
      message: "User created",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: "user"
      }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      await logSecurityEvent({
        event: "user.create.failure",
        outcome: "failure",
        userId: req.user.id,
        organizationId: req.user.organizationId,
        reason: "duplicate_email",
        resourceType: "user"
      });
      return res.status(409).json({ error: "Email already exists" });
    }

    await logSecurityEvent({
      event: "user.create.error",
      outcome: "error",
      userId: req.user.id,
      organizationId: req.user.organizationId,
      reason: "internal_error",
      resourceType: "user"
    });
    return res.status(500).json({ error: "Unable to create user" });
  }
});

export default router;