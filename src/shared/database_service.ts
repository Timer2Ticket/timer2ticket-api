import { Constants } from './constants';
import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { User } from '../models/user';
import { JobLog } from '../models/jobLog';
import { TtlToken } from '../models/ttl_token';

export class DatabaseService {
  private static _mongoDbName = process.env.DB_NAME || 'timer2ticketDB';
  private static _usersCollectionName = 'users';
  private static _jobLogsCollectionName = 'jobLogs';
  private static _ttlTokensTwoDaysCollectionName = 'ttlTokensTwoDays';
  private static _ttlTokensOneHourCollectionName = 'ttlTokensOneHour';

  private static _instance: DatabaseService;

  private _mongoClient: MongoClient | undefined;
  private _db: Db | undefined;

  private _usersCollection: Collection<User> | undefined;
  private _jobLogsCollection: Collection<JobLog> | undefined;

  // these two are representing same objects, but in DB are stored in different collections because of different expiration time
  private _ttlTokensTwoDaysCollection: Collection<TtlToken> | undefined;
  private _ttlTokensOneHourCollection: Collection<TtlToken> | undefined;

  private _initCalled = false;

  public static get Instance(): DatabaseService {
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
    if (this._initCalled) {
      return false;
    }
    this._initCalled = true;
    // Make a connection to MongoDB Service
    this._mongoClient = new MongoClient(Constants.mongoDbUrl, { useUnifiedTopology: true });

    await this._mongoClient.connect();
    console.log("Connected to MongoDB!");

    if (!this._mongoClient) return false;

    this._db = this._mongoClient.db(DatabaseService._mongoDbName);

    this._usersCollection = this._db.collection(DatabaseService._usersCollectionName);
    this._jobLogsCollection = this._db.collection(DatabaseService._jobLogsCollectionName);
    this._ttlTokensTwoDaysCollection = this._db.collection(DatabaseService._ttlTokensTwoDaysCollectionName);
    this._ttlTokensOneHourCollection = this._db.collection(DatabaseService._ttlTokensOneHourCollectionName);

    return true;
  }

  private _close() {
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

  // ***********************************************************
  // JOB LOGS **************************************************
  // ***********************************************************

  async getJobLogsByUserId(userId: string): Promise<JobLog[]> {
    if (!this._jobLogsCollection) return [];

    const filterQuery = { userId: new ObjectId(userId) };
    // sort by date desc, limit to only 100
    const sortQuery = { scheduledDate: -1 };
    return this._jobLogsCollection
      .find(filterQuery)
      .sort(sortQuery)
      .limit(100)
      .toArray();
  }

  // ***********************************************************
  // TTL TOKENS ************************************************
  // ***********************************************************

  async getTtlTokenTwoDays(token: string): Promise<TtlToken | null> {
    if (!this._ttlTokensTwoDaysCollection) return null;

    const filterQuery = { token: token };

    return await this._ttlTokensTwoDaysCollection.findOne(filterQuery);
  }

  async createTtlTokenTwoDaysForUsername(username: string): Promise<TtlToken | null> {
    if (!this._ttlTokensTwoDaysCollection) return null;

    const newTtlToken = new TtlToken(username);

    const result = await this._ttlTokensTwoDaysCollection.insertOne(newTtlToken);
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  async deleteTtlTokenTwoDays(id: string | ObjectId): Promise<boolean | null> {
    if (!this._ttlTokensTwoDaysCollection) return null;

    const filterQuery = { _id: new ObjectId(id) };

    const result = await this._ttlTokensTwoDaysCollection.deleteOne(filterQuery);
    return result.result.ok === 1;
  }

  async getTtlTokenOneHour(token: string): Promise<TtlToken | null> {
    if (!this._ttlTokensOneHourCollection) return null;

    const filterQuery = { token: token };

    return await this._ttlTokensOneHourCollection.findOne(filterQuery);
  }

  async createTtlTokenOneHourForUsername(username: string): Promise<TtlToken | null> {
    if (!this._ttlTokensOneHourCollection) return null;

    const newTtlToken = new TtlToken(username);

    const result = await this._ttlTokensOneHourCollection.insertOne(newTtlToken);
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  async deleteTtlTokenOneHour(id: string | ObjectId): Promise<boolean | null> {
    if (!this._ttlTokensOneHourCollection) return null;

    const filterQuery = { _id: new ObjectId(id) };

    const result = await this._ttlTokensOneHourCollection.deleteOne(filterQuery);
    return result.result.ok === 1;
  }
}

export const databaseService = DatabaseService.Instance;