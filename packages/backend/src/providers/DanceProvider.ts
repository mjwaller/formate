import { Db, ObjectId, Collection, InsertOneResult } from "mongodb";
import { v4 as uuidv4 } from "uuid";

export interface Position {
  dancerIndex: number;
  x: number; // percent 0–100
  y: number; // percent 0–100
}

export interface Formation {
  id: string;         // uuid
  positions: Position[];
}

export interface Dance {
  _id: ObjectId;
  userId: string;     // username from JWT
  name: string;
  numberOfDancers: number;
  formations: Formation[]; 
}

type NewDance = Omit<Dance, "_id">;


export class DanceProvider {
    private collection: Collection<Dance>;
  
    constructor(private db: Db) {
      this.collection = db.collection<Dance>("dances");
    }
  
    async createDance(
      userId: string,
      name: string,
      numberOfDancers: number
    ): Promise<Dance> {
      // validate numberOfDancers...
      // (1–20 check)
  
      // build default positions
      const positions = Array.from({ length: numberOfDancers }).map((_, i) => ({
        dancerIndex: i,
        x: (100 * i) / (numberOfDancers - 1 || 1),
        y: 50,
      }));
      const formation = { id: uuidv4(), positions };
  
      // create the “new dance” payload
      const newDance: NewDance = {
        userId,
        name,
        numberOfDancers,
        formations: [formation],
      };
  
      // cast to any so mongo will accept it
      const result: InsertOneResult<Dance> = await this.collection.insertOne(
        newDance as any
      );
  
      // reconstruct the full Dance with the generated _id
      return {
        _id: result.insertedId,
        ...newDance,
      };
    }
  /** Update dance metadata (name or numberOfDancers) */
  async updateDance(
    danceId: string,
    userId: string,
    update: { name?: string; numberOfDancers?: number }
  ): Promise<boolean> {
    const filter = { _id: new ObjectId(danceId), userId };

    if (
      update.numberOfDancers !== undefined &&
      (update.numberOfDancers < 1 || update.numberOfDancers > 20)
    ) {
      throw new Error('numberOfDancers must be 1–20');
    }

    const { matchedCount } = await this.collection.updateOne(
      filter,
      { $set: update }
    );
    return matchedCount > 0;
  }

  /** Delete a dance (and all its formations) */
  deleteDance(danceId: string, userId: string) {
    return this.collection.deleteOne({ _id: new ObjectId(danceId), userId });
  }

  /** Add a new formation cloned from the last one */
  async addFormation(danceId: string, userId: string): Promise<Formation | null> {
    const dance = await this.collection.findOne({ _id: new ObjectId(danceId), userId });
    if (!dance) return null;

    const last = dance.formations[dance.formations.length - 1];
    const positions = last.positions.map(p => ({ ...p }));
    const newFormation: Formation = { id: uuidv4(), positions };

    await this.collection.updateOne(
      { _id: dance._id },
      { $push: { formations: newFormation } }
    );
    return newFormation;
  }

  /** Update an existing formation’s positions */
  async updateFormation(
    danceId: string,
    formationId: string,
    userId: string,
    positions: Position[]
  ): Promise<boolean> {
    const filter = {
      _id: new ObjectId(danceId),
      userId,
      'formations.id': formationId,
    };
    const update = {
      $set: { 'formations.$.positions': positions },
    };
    const { matchedCount } = await this.collection.updateOne(filter, update);
    return matchedCount > 0;
  }

  /** Delete a formation */
  async deleteFormation(
    danceId: string,
    formationId: string,
    userId: string
  ): Promise<boolean> {
    const { modifiedCount } = await this.collection.updateOne(
      { _id: new ObjectId(danceId), userId },
      { $pull: { formations: { id: formationId } } }
    );
    return modifiedCount > 0;
  }
  public getAllDances(userId: string): Promise<Dance[]> {
    return this.collection.find({ userId }).toArray();
  }

}
