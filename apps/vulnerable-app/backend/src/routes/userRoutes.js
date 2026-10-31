import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

// INTENTIONAL LAB VULNERABILITIES:
// 1. Any authenticated user can create accounts.
// 2. The requester controls the new user's role.
router.post("/", async (req, res) => {
  const { name, email, password, role = "user" } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !["admin", "user"].includes(role)
  ) {
    return res.status(400).json({ error: "Invalid user details" });
  }

  if (
    name.trim().length < 2 ||
    name.trim().length > 150 ||
    email.trim().length > 255 ||
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
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.organizationId,
        name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        role
      ]
    );

    return res.status(201).json({
      message: "User created",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role
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