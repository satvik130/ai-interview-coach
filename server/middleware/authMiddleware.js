import jwt from 'jsonwebtoken';

/**
 * Authentication middleware:
 * 1. Reads Bearer token from Authorization header
 * 2. Verifies the token with JWT_SECRET
 * 3. Attaches decoded user ID to req.user
 */
export const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and begins with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token string after 'Bearer '
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user ID to req.user
      req.user = {
        id: decoded.id,
      };

      return next();
    } catch (error) {
      console.error(`[Auth Middleware] Token verification failed: ${error.message}`);
      return res.status(401).json({
        message: 'Not authorized, token invalid or expired',
      });
    }
  }

  // If no token was provided in header
  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token provided',
    });
  }
};

export default protect;
