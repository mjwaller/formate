import express, { Request, Response } from "express";
import { Db } from "mongodb";
import { DanceProvider, Position } from "../providers/DanceProvider";

export function registerDanceRoutes(app: express.Application, db: Db) {
  const provider = new DanceProvider(db);
  const router = express.Router();

  // helper to get username from req.user
  const getUser = (req: Request) => req.user!.username;

  // GET /api/dances
  router.get("/", async (req: Request, res: Response) => {
    const dances = await provider.getAllDances(getUser(req));
    res.send(dances);
    return;
  });

  // POST /api/dances
  router.post("/", async (req: Request, res: Response) => {
    const { name, numberOfDancers } = req.body;
    if (typeof name !== "string" || typeof numberOfDancers !== "number") {
      res.status(400).send({ error: "Bad Request" });
      return;
    }
    try {
      const dance = await provider.createDance(
        getUser(req),
        name,
        numberOfDancers
      );
      res.status(201).send(dance);
      return;
    } catch (e: any) {
      res.status(400).send({ error: e.message });
      return;
    }
  });

  // PUT /api/dances/:danceId
  router.put("/:danceId", async (req: Request, res: Response) => {
    const { danceId } = req.params;
    const update = req.body;
    try {
      const ok = await provider.updateDance(danceId, getUser(req), update);
      if (!ok) {
        res.status(404).end();
        return;
      }
      res.sendStatus(204);
      return;
    } catch (e: any) {
      res.status(400).send({ error: e.message });
      return;
    }
  });

  // DELETE /api/dances/:danceId
  router.delete("/:danceId", async (req: Request, res: Response) => {
    const { danceId } = req.params;
    await provider.deleteDance(danceId, getUser(req));
    res.sendStatus(204);
    return;
  });

  // POST /api/dances/:danceId/formations
  router.post("/:danceId/formations", async (req: Request, res: Response) => {
    const { danceId } = req.params;
    const formation = await provider.addFormation(danceId, getUser(req));
    if (!formation) {
      res.status(404).end();
      return;
    }
    res.status(201).send(formation);
    return;
  });

  // PUT /api/dances/:danceId/formations/:formationId
  router.put(
    "/:danceId/formations/:formationId",
    async (req: Request, res: Response) => {
      const { danceId, formationId } = req.params;
      const positions: Position[] = req.body.positions;
      if (!Array.isArray(positions)) {
        res.status(400).send({ error: "Bad Request" });
        return;
      }
      try {
        const ok = await provider.updateFormation(
          danceId,
          formationId,
          getUser(req),
          positions
        );
        if (!ok) {
          res.status(404).end();
          return;
        }
        res.sendStatus(204);
        return;
      } catch (e: any) {
        res.status(400).send({ error: e.message });
        return;
      }
    }
  );

  // DELETE /api/dances/:danceId/formations/:formationId
  router.delete(
    "/:danceId/formations/:formationId",
    async (req: Request, res: Response) => {
      const { danceId, formationId } = req.params;
      const ok = await provider.deleteFormation(
        danceId,
        formationId,
        getUser(req)
      );
      if (!ok) {
        res.status(404).end();
        return;
      }
      res.sendStatus(204);
      return;
    }
  );

  app.use("/api/dances", router);
}
