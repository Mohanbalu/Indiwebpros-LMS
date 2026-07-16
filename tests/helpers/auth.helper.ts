import jwt from "jsonwebtoken";

// Helpers for testing JWT generation and route authorization
export const AuthHelper = {
  // Generates a mock access token for the given user ID and role
  generateToken: (userId: string, role: string, expiresIn = "15m", secret?: string): string => {
    const jwtSecret =
      secret || process.env.JWT_SECRET || "test_jwt_secret_key_123456_lms_observability";
    return jwt.sign({ userId, role }, jwtSecret, { expiresIn });
  },

  // Generates request headers containing authorization token
  authHeaders: (userId: string, role: string): Record<string, string> => {
    const token = AuthHelper.generateToken(userId, role);
    return {
      Authorization: `Bearer ${token}`,
    };
  },
};
