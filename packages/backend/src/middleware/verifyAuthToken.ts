// packages/backend/src/middleware/verifyAuthToken.ts

import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

interface IAuthTokenPayload {
  username: string;
}

// Let TS know `req.user` exists
declare global {
  namespace Express {
    interface Request {
      user?: IAuthTokenPayload;
    }
  }
}

// Explicitly type as RequestHandler
export const verifyAuthToken: RequestHandler = (req, res, next) => {
  const authHeader = req.get("Authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) {
    res.status(401).end();
    return;
  }

  // Annotate the callback args to avoid implicit any
  jwt.verify(
    token,
    req.app.locals.JWT_SECRET as string,
    (err: any, decoded: any) => {
      if (err || typeof decoded !== "object" || !("username" in decoded)) {
        return res.status(403).end();
      }
      req.user = decoded as IAuthTokenPayload;
      next();
    }
  );
};
