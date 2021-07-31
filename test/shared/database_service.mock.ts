import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { User } from "../../src/models/user";
import { Constants } from "../../src/shared/constants";

export class DatabaseServiceMock {
  private static _mongoDbName = process.env.DB_NAME || 'timer2ticketDB-test';
  private static _usersCollectionName = 'users';

  private static _instance: DatabaseServiceMock;

  private _mongoClient: MongoClient | undefined;
  private _db: Db | undefined;

  private _usersCollection: Collection<User> | undefined;

  private _isReady = false;
  isReady = (): boolean => this._isReady;

  public static get Instance(): DatabaseServiceMock {
    return this._instance || (this._instance = new this());
  }

  /**
   * Private empty constructor to make sure that this is correct singleton
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() { }

  /**
   * Needs to be called (and awaited) to correctly connect to the database
   */
  public async init(): Promise<boolean> {
    // Make a connection to MongoDB Service
    this._mongoClient = new MongoClient(Constants.mongoDbUrl, { useUnifiedTopology: true });

    await this._mongoClient.connect();

    if (!this._mongoClient) return false;

    this._db = this._mongoClient.db(DatabaseServiceMock._mongoDbName);

    this._usersCollection = this._db.collection(DatabaseServiceMock._usersCollectionName);

    return true;
  }

  public close(): void {
    this._mongoClient?.close();
  }

  // ***********************************************************
  // USERS *****************************************************
  // ***********************************************************

  async getUserById(userId: string): Promise<User | null> {
    if (!this._usersCollection) return null;

    const filterQuery = { _id: new ObjectId(userId) };
    return this._usersCollection.findOne(filterQuery);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!this._usersCollection) return null;

    const filterQuery = { username: username };
    return this._usersCollection.findOne(filterQuery);
  }

  async createUser(username: string, passwordHash: string): Promise<User | null> {
    if (!this._usersCollection) return null;

    const result = await this._usersCollection.insertOne(User.default(username, passwordHash));
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  async updateUser(user: User): Promise<User | null> {
    if (!this._usersCollection) return null;

    const filterQuery = { _id: new ObjectId(user._id) };

    const result = await this._usersCollection.replaceOne(filterQuery, user);
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  async wipeAllData(): Promise<boolean> {
    const result = await this._usersCollection?.deleteMany({});
    return result?.result.ok === 1;
  }
}

export const databaseServiceMock = DatabaseServiceMock.Instance;