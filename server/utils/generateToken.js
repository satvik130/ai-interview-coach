import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT for a given user ID.
 *
 * @param {string} id - The MongoDB user document ID
 * @returns {string} The signed JWT string
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export default generateToken;
