import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from environment variables");
}

app.disable("x-powered-by");

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "SecureSaaS Vulnerable Application",
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

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `Vulnerable API running at http://127.0.0.1:${PORT}`
  );
});
