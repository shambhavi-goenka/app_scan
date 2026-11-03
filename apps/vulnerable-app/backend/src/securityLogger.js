import pool from "./config/database.js";

const LOG_TO_DB = (process.env.LOG_TO_DB ?? "true") === "true";

export async function logSecurityEvent({
  event,
  outcome,
  userId = null,
  organizationId = null,
  reason = null,
  resourceType = null,
  resourceId = null
}) {
  try {

    if(!LOG_TO_DB) {
      console.log(JSON.stringify(entry));
      return true;
    }

    await pool.execute(
    `INSERT INTO audit_logs
      (user_id, organization_id, action, outcome, reason,
        resource_type, resource_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      organizationId,
      event,
      outcome,
      reason,
      resourceType,
      resourceId
    ]
  );

    return true;
  } 
  catch {
    console.error("Security audit log write failed");
    return false;
  }
}