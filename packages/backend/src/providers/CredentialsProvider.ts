import { Db, Collection } from "mongodb";
import bcrypt from "bcrypt";

export interface IUserCreds {
  _id: string;      // use username as _id
  username: string;
  password: string; // salted+hashed via bcrypt
}

export class CredentialsProvider {
  private collection: Collection<IUserCreds>;

  constructor(db: Db) {
    console.log("💡 CredentialsProvider db name:", db.databaseName);
    this.collection = db.collection<IUserCreds>("users");
    console.log("📁 Collection namespace:", this.collection.namespace);
  }

  /** 
   * Returns `true` on success, or `"USERNAME_EXISTS"` if taken 
   */
  async registerUser(
    username: string,
    password: string
  ): Promise<true | "USERNAME_EXISTS"> {
    const existing = await this.collection.findOne({ username });
    if (existing) return "USERNAME_EXISTS";

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await this.collection.insertOne({
      _id: username,
      username,
      password: hash,
    });
    return true;
  }

  /** Returns `true` if username/password match */
  async verifyPassword(username: string, password: string): Promise<boolean> {
    const user = await this.collection.findOne({ username });
    if (!user) return false;
    return bcrypt.compare(password, user.password);
  }
}
