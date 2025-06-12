import express, { Request, Response } from "express";
import * as dotenv from "dotenv";

dotenv.config(); // Read the .env file in the current working directory, and load values into process.env.

import { connectMongo } from "./connectMongo";
import { registerAuthRoutes } from "./routes/authRoutes";
import { verifyAuthToken } from "./middleware/verifyAuthToken";
import { registerDanceRoutes } from "./routes/danceRoutes";

const mongoClient = connectMongo();
// index.ts
const db = mongoClient.db();
console.log("📂 Using DB:", db.databaseName);

mongoClient.connect()
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

app.locals.JWT_SECRET = process.env.JWT_SECRET;
registerAuthRoutes(app, mongoClient.db());

app.use("/api", verifyAuthToken);
registerDanceRoutes(app, mongoClient.db());

app.get("/hello", (req: Request, res: Response) => {
    res.send("Hello, World");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
