import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in the environment variables');
}

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
}

export const generateToken = (userId: string): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
}

export interface JwtPayload {
    // userId: string;
    id: string;
    iat: number;
    exp: number;
}

export const verifyToken = (token: string): JwtPayload | null => {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

export const getUserIdFromToken = (token: string): string | null => {
    const payload = verifyToken(token);
    return payload ? payload.id : null;
}

export const isTokenExpired = (token: string): boolean => {
    const payload = verifyToken(token);
    if (!payload) {
        return true; // Token is invalid or expired
    }
    return Date.now() >= payload.exp * 1000;
}