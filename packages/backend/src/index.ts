// packages/backend/src/index.ts
import express, { Request, Response } from "express";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config(); // load .env into process.env

import { connectMongo } from "./connectMongo";
import { registerAuthRoutes } from "./routes/authRoutes";
import { verifyAuthToken } from "./middleware/verifyAuthToken";
import { registerDanceRoutes } from "./routes/danceRoutes";

const mongoClient = connectMongo();
const db = mongoClient.db();
console.log("📂 Using DB:", db.databaseName);

mongoClient
  .connect()
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());
app.locals.JWT_SECRET = process.env.JWT_SECRET!;

// 1️⃣ Authentication routes (no token required)
registerAuthRoutes(app, db);

// 2️⃣ Protect everything under /api with JWT middleware
app.use("/api", verifyAuthToken);

// 3️⃣ Application routes (dances + formations)
registerDanceRoutes(app, db);

// 4️⃣ Static file serving for the React build
//    __dirname at runtime is “.../packages/backend/dist”
const FRONTEND_DIST = path.resolve(__dirname, "../..", "frontend", "dist");
app.use(express.static(FRONTEND_DIST));

// 5️⃣ Catch-all: serve index.html for client-side routing
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"));
});

// 6️⃣ Start the server on all network interfaces
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
