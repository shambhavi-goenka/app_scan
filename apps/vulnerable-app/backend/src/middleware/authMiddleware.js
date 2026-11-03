import jwt from "jsonwebtoken";
import { logSecurityEvent } from "../securityLogger.js";

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {

    await logSecurityEvent({
      event: "auth.token.rejected",
      outcome: "failure",
      reason: "missing_bearer_token",
      resourceType: "authentication"
    });
    
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "securesaas-api",
      audience: "securesaas-client"
    });

    if (
        !Number.isSafeInteger(Number(decoded.sub)) ||
        Number(decoded.sub) < 1 ||
        !Number.isSafeInteger(Number(decoded.organizationId)) ||
        Number(decoded.organizationId) < 1 ||
        !["admin", "user"].includes(decoded.role)
      ) {
        await logSecurityEvent({
          event: "auth.token.rejected",
          outcome: "failure",
          reason: "invalid_token_claims",
          resourceType: "authentication"
        });
        return res.status(401).json({
          error: "Invalid token claims"
        });
      }

    req.user = {
      id: Number(decoded.sub),
      organizationId: Number(decoded.organizationId),
      role: decoded.role
    };

    next();
  } 
  catch {
    await logSecurityEvent({
      event: "auth.token.rejected",
      outcome: "failure",
      reason: "invalid_or_expired_token",
      resourceType: "authentication"
    });

    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
