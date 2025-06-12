import express, { Request, Response } from "express";
import { Db } from "mongodb";
import jwt from "jsonwebtoken";
import { CredentialsProvider } from "../providers/CredentialsProvider";

interface IAuthTokenPayload {
  username: string;
}

// Helper to sign a JWT
function generateAuthToken(
  username: string,
  jwtSecret: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const payload: IAuthTokenPayload = { username };
    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: "1d" },
      (err, token) => {
        if (err) reject(err);
        else resolve(token as string);
      }
    );
  });
}

/**
 * Registers /auth routes on the given Express app.
 */
export function registerAuthRoutes(app: express.Application, db: Db) {
  const creds = new CredentialsProvider(db);
  const router = express.Router();

  router.post("/register", async (req: Request, res: Response) => {
    console.log("📨 POST /auth/register hit");
    const { username, password } = req.body;
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).send({ error: "Bad Request", message: "Missing username or password" });
      return;
    }

    const result = await creds.registerUser(username, password);
    if (result === "USERNAME_EXISTS") {
      res.status(409).send({ error: "Conflict", message: "Username already taken" });
      return;
    }

    // On successful registration, issue JWT:
    const token = await generateAuthToken(username, app.locals.JWT_SECRET);
    res.status(201).send({ token });
    return;
  });

  router.post("/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).send({ error: "Bad Request", message: "Missing username or password" });
      return;
    }

    const valid = await creds.verifyPassword(username, password);
    if (!valid) {
      res.status(401).send({ error: "Unauthorized", message: "Incorrect username or password" });
      return;
    }

    const token = await generateAuthToken(username, app.locals.JWT_SECRET);
    res.send({ token });
    return;
  });

  app.use("/auth", router);
}
