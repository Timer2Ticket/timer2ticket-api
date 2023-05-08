import { Constants } from './constants';
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import { User } from '../models/user/user';
import { JobLog } from '../models/jobLog';
import { Membership } from '../models/commrecial/membership/membership';
import { MembershipInfo } from '../models/commrecial/membership/membership_info';
import { Connection } from '../models/connection/connection';

export class DatabaseService {
  private static _mongoDbName = process.env.DB_NAME || 'timer2ticketDB_new';
  private static _usersCollectionName = 'users';
  private static _membershipCollectionName = 'membership';
  private static _membershipInfoCollectionName = 'membershipInfo';
  private static _connectionsCollectionName = 'connections';
  private static _jobLogsCollectionName = 'jobLogs';

  private static _instance: DatabaseService;

  private _mongoClient: MongoClient | undefined;
  private _db: Db | undefined;

  private _usersCollection: Collection<User> | undefined;
  private _membershipCollection: Collection<Membership> | undefined;
  private _membershipInfoCollection: Collection<MembershipInfo> | undefined;
  private _connectionsCollection: Collection<Connection> | undefined;
  private _jobLogsCollection: Collection<JobLog> | undefined;

  private _initCalled = false;

  public static get Instance(): DatabaseService {
    return this._instance || (this._instance = new this());
  }

  /**
   * Private empty constructor to make sure that this is correct singleton
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {
  }

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

    if (!this._mongoClient) return false;

    this._db = this._mongoClient.db(DatabaseService._mongoDbName);

    this._usersCollection = this._db.collection(DatabaseService._usersCollectionName);
    this._membershipCollection = this._db.collection(DatabaseService._membershipCollectionName);
    this._membershipInfoCollection = this._db.collection(DatabaseService._membershipInfoCollectionName);
    this._connectionsCollection = this._db.collection(DatabaseService._connectionsCollectionName);

    this._jobLogsCollection = this._db.collection(DatabaseService._jobLogsCollectionName);

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

    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      return null;
    }

    const filterQuery = { _id: objectId };
    return this._usersCollection.findOne(filterQuery);
  }

  async getUserByAuth0UserId(auth0UserId: string): Promise<User | null> {
    if (!this._usersCollection) return null;

    const filterQuery = { auth0UserId: auth0UserId };
    return this._usersCollection.findOne(filterQuery);
  }

  async createUser(auth0UserId: string): Promise<User | null> {
    if (!this._usersCollection) return null;

    const result = await this._usersCollection.insertOne(User.default(auth0UserId));
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  async getNextConnectionId(auth0UserId: string): Promise<number | null> {
    const user = await this.getUserByAuth0UserId(auth0UserId);
    if (!user) {
      return null;
    }
    const nextId = user.connectionId++;
    await this.updateUser(user);

    return nextId;
  }

  async updateUser(user: User): Promise<User | null> {
    if (!this._usersCollection) return null;

    const filterQuery = { _id: user._id };
    const result = await this._usersCollection.replaceOne(filterQuery, user);
    return result.result.ok === 1 ? user : null;
  }

  // ***********************************************************
  // JOB LOGS **************************************************
  // ***********************************************************

  // async getJobLogsByUserId(userId: string): Promise<JobLog[]> {
  //   if (!this._jobLogsCollection) return [];
  //
  //   const filterQuery = { userId: new ObjectId(userId) };
  //   // sort by date desc, limit to only 100
  //   const sortQuery = { scheduledDate: -1 };
  //   return this._jobLogsCollection
  //     .find(filterQuery)
  //     .sort(sortQuery)
  //     .limit(100)
  //     .toArray();
  // }


  // ***********************************************************
  // MEMBERSHIP INFO *******************************************
  // ***********************************************************

  async createMembershipInfo(userId: ObjectId): Promise<MembershipInfo | null> {
    if (!this._membershipInfoCollection) return null;

    const result = await this._membershipInfoCollection.insertOne(MembershipInfo.default(userId));
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  async getMembershipInfoByUserId(userId: ObjectId): Promise<MembershipInfo | null> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { userId: userId };
    return this._membershipInfoCollection.findOne(filterQuery);
  }

  async updateMembershipInfo(userId: ObjectId, newMembershipInfo: MembershipInfo): Promise<MembershipInfo | null> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { userId: userId };

    const result = await this._membershipInfoCollection.replaceOne(filterQuery, newMembershipInfo);
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  // ***********************************************************
  // MEMBERSHIP ************************************************
  // ***********************************************************

  async getMembershipById(id: ObjectId): Promise<Membership | null> {
    if (!this._membershipCollection) return null;

    const filterQuery = { _id: id };
    return this._membershipCollection.findOne(filterQuery);
  }

  async getActiveMembershipByName(name: string): Promise<Membership | null> {
    if (!this._membershipCollection) return null;

    const filterQuery = { name: name, status: 'Active' };
    return this._membershipCollection.findOne(filterQuery);
  }

  // ***********************************************************
  // CONNECTIONS ***********************************************
  // ***********************************************************

  async createConnection(connection: Connection): Promise<Connection | null> {
    if (!this._connectionsCollection) return null;

    const result = await this._connectionsCollection.insertOne(connection);
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  async getConnectionsByUserId(userId: ObjectId): Promise<Connection[]> {
    if (!this._connectionsCollection) return [];

    const filterQuery = { userId: userId };
    return this._connectionsCollection.find(filterQuery).toArray();
  }

  async getConnectionById(id: ObjectId): Promise<Connection | null> {
    if (!this._connectionsCollection) return null;

    const filterQuery = { _id: id };

    return this._connectionsCollection.findOne(filterQuery);
  }

  async updateConnectionById(id: ObjectId, connection: Connection): Promise<Connection | null> {
    if (!this._connectionsCollection) return null;

    const filterQuery = { _id: id };

    const result = await this._connectionsCollection.replaceOne(filterQuery, connection);
    return result.result.ok === 1 ? connection : null;
  }

  async deleteConnectionById(id: ObjectId): Promise<boolean> {
    if (!this._connectionsCollection) return false;

    const filterQuery = { _id: id };

    const result = await this._connectionsCollection.deleteOne(filterQuery);
    return result.result.ok === 1;
  }
}

export const databaseService = DatabaseService.Instance;