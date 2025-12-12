import jwt from "jsonwebtoken";

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and attaches user info to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const auth = (req, res, next) => {
  // Extract Authorization header from request
  const header = req.headers.authorization;

  // Check if header exists and follows Bearer token format
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid auth header" });
  }

  // Extract token from "Bearer <token>" format
  const token = header.split(" ")[1];

  try {
    // Verify and decode JWT token using secret from environment
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach decoded user info (id, role) to request object for use in routes
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    // Token is invalid, expired, or malformed
    console.error("Auth error:", err);
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

/**
 * Admin-only authorization middleware
 * Must be used after auth middleware to check if user has admin role
 * @param {Object} req - Express request object (must have req.user from auth middleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const requireAdmin = (req, res, next) => {
  // Check if user exists and has admin role
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};
