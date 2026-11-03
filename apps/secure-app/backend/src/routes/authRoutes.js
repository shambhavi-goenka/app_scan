import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import pool from "../config/database.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";
import { logSecurityEvent } from "../securityLogger.js";

const router = Router();

function createToken(user) {
  return jwt.sign(
    {
      organizationId: user.organization_id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      subject: String(user.id),
      algorithm: "HS256",
      expiresIn: "1h",
      issuer: "securesaas-api",
      audience: "securesaas-client"
    }
  );
}

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts. Please try again later.",
  },
});

// ORGANIZATION REGISTRATION
router.post("/register", async (req, res) => {
  const { organizationName, name, email, password } = req.body;

  if (
    typeof organizationName !== "string" ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      error: "All fields are required"
    });
  }

  const cleanOrganizationName = organizationName.trim();
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (
    cleanOrganizationName.length < 2 ||
    cleanOrganizationName.length > 150 ||
    cleanName.length < 2 ||
    cleanName.length > 150 ||
    cleanEmail.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    password.length < 12 ||
    password.length > 128
  ) {
    return res.status(400).json({
      error: "Please provide valid registration details. Password must be 12–128 characters."
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const slugBase = cleanOrganizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "organization";

    const slug = `${slugBase}-${randomUUID().slice(0, 8)}`;

    const [organizationResult] = await connection.execute(
      `INSERT INTO organizations (name, slug)
       VALUES (?, ?)`,
      [cleanOrganizationName, slug]
    );

    const passwordHash = await bcrypt.hash(password, 12);

    const [userResult] = await connection.execute(
      `INSERT INTO users
       (organization_id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'admin')`,
      [
        organizationResult.insertId,
        cleanName,
        cleanEmail,
        passwordHash
      ]
    );

    await connection.commit();

    const user = {
      id: userResult.insertId,
      organization_id: organizationResult.insertId,
      role: "admin"
    };

    const token = createToken(user);

    return res.status(201).json({
      message: "Organization registered successfully",
      token,
      user: {
        id: user.id,
        name: cleanName,
        email: cleanEmail,
        role: user.role
      },
      organization: {
        id: organizationResult.insertId,
        name: cleanOrganizationName,
        slug
      }
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {

      await logSecurityEvent({
        event: "user.create.failure",
        outcome: "failure",
        reason: "duplicate_email",
        resourceType: "user"
      });

      return res.status(409).json({
        error: "An account with this email already exists"
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      error: "Registration failed"
    });
  } finally {
    connection.release();
  }
});

// USER LOGIN
router.post("/login", loginRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 255 ||
    password.length > 128
  ) {
    return res.status(400).json({
      error: "Email and password are required"
    });
  }

  try {
    const [users] = await pool.execute(
      `SELECT id, organization_id, name, email,
              password_hash, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      await logSecurityEvent({
        event: "auth.login.failure",
        outcome: "failure",
        reason: "invalid_credentials",
        resourceType: "authentication"
      });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      await logSecurityEvent({
        event: "auth.login.failure",
        outcome: "failure",
        userId: Number(user.id),
        organizationId: Number(user.organization_id),
        reason: "invalid_credentials",
        resourceType: "user",
        resourceId: Number(user.id)
      });
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = createToken(user);

    await logSecurityEvent({
      event: "auth.login.success",
      outcome: "success",
      userId: Number(user.id),
      organizationId: Number(user.organization_id),
      resourceType: "user",
      resourceId: Number(user.id)
    });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id
      }
    });
  } 
  catch (error) {
    await logSecurityEvent({
      event: "auth.login.error",
      outcome: "error",
      reason: "internal_error",
      resourceType: "authentication"
    });
    return res.status(500).json({ error: "Login failed" });
  }
});

// GET CURRENT USER
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, organization_id, name, email, role
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: "User no longer exists"
      });
    }

    return res.json({
      user: users[0]
    });
  } catch (error) {
    console.error("Current user error:", error.message);

    return res.status(500).json({
      error: "Unable to retrieve user"
    });
  }
});

export default router;
