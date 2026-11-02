import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

// Only administrators can create users.
// New users are always assigned the "user" role.
router.post("/", async (req, res) => {
  if (req.user.role !== "admin") {
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
      return res.status(409).json({ error: "Email already exists" });
    }

    console.error("User creation failed:", error.message);
    return res.status(500).json({ error: "Unable to create user" });
  }
});

export default router;