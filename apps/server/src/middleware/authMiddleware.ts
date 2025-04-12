import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../services/auth.service";

declare global {
    namespace Express {
        interface Request {
            user?: { id: string };
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        res.sendStatus(401); // Unauthorized
        return; // Add this line
    }

    const payload = verifyToken(token);

    if (!payload) {
        res.sendStatus(403); // Forbidden
        return; // Add this line
    }

    req.user = { id: payload.id };
    next();
};