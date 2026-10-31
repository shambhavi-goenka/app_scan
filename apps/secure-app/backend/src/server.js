import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from 'helmet';
import pool from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// HTTP security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  })
);

// Restrict browser features
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  next();
});

// Prevent caching of API responses
app.use((req, res, next) => {
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
});

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from environment variables");
}

app.disable("x-powered-by");

app.use(cors({
  origin: "http://localhost:5174"
}));

app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "SecureSaaS Secure Application",
    message: "API is running"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(503).json({
      status: "error",
      database: "unavailable"
    });
  }
});

app.use("/api/auth", authRoutes);

const PORT = Number(process.env.PORT || 3001);

// Error page not found
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Secure API running at http://127.0.0.1:${PORT}`
  );
});
