import { Constants } from './constants';
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import { User } from '../models/user/user';
import { JobLog } from '../models/job_log';
import { MembershipInfo } from '../models/commrecial/membership_info';
import { Connection } from '../models/connection/connection';
import { ImmediateSyncLog } from '../models/commrecial/immediate_sync_log';

export class DatabaseService {
  private static _mongoDbName = Constants.dbName || 'timer2ticketDB_new';
  private static _usersCollectionName = 'users';
  private static _connectionsCollectionName = 'connections';
  private static _jobLogsCollectionName = 'jobLogs';
  // for commercial version
  private static _membershipInfoCollectionName = 'membershipInfo';
  private static _immediateSyncLogsCollectionName = 'immediateSyncLogs';

  private static _instance: DatabaseService;

  private _mongoClient: MongoClient | undefined;
  private _db: Db | undefined;

  private _usersCollection: Collection<User> | undefined;
  private _membershipInfoCollection: Collection<MembershipInfo> | undefined;
  private _connectionsCollection: Collection<Connection> | undefined;
  private _jobLogsCollection: Collection<JobLog> | undefined;
  private _immediateSyncLogsCollection: Collection<ImmediateSyncLog> | undefined;

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
    this._connectionsCollection = this._db.collection(DatabaseService._connectionsCollectionName);
    this._jobLogsCollection = this._db.collection(DatabaseService._jobLogsCollectionName);

    if (Constants.isCommercialVersion) {
      this._membershipInfoCollection = this._db.collection(DatabaseService._membershipInfoCollectionName);
      this._immediateSyncLogsCollection = this._db.collection(DatabaseService._immediateSyncLogsCollectionName);
    }
    return true;
  }

  private _close() {
    this._mongoClient?.close();
  }

  // ***********************************************************
  // USERS *****************************************************
  // ***********************************************************

  /**
   * Get user by user id
   * @param userId
   */
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

  /**
   * Get user by auth0 user id
   * @param auth0UserId
   */
  async getUserByAuth0UserId(auth0UserId: string): Promise<User | null> {
    if (!this._usersCollection) return null;

    const filterQuery = { auth0UserId: auth0UserId };
    return this._usersCollection.findOne(filterQuery);
  }

  /**
   * Create user
   * @param auth0UserId
   * @param userMail
   */
  async createUser(auth0UserId: string, userMail: string | null): Promise<User | null> {
    if (!this._usersCollection) return null;

    const result = await this._usersCollection.insertOne(User.default(auth0UserId, userMail));
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  /**
   * Get next id of connection for user defined by auth0 user id
   * @param auth0UserId
   */
  async getNextConnectionId(auth0UserId: string): Promise<number | null> {
    if (!this._usersCollection) return null;

    const filterQuery = { auth0UserId: auth0UserId };
    const result = await this._usersCollection.findOneAndUpdate(filterQuery, { $inc: { connectionId: 1 } });

    if (!result.value) {
      return null;
    }

    return result.value.connectionId;
  }

  /**
   * Update user
   * @param id
   * @param user
   */
  async updateUser(id: ObjectId, user: User): Promise<User | null> {
    if (!this._usersCollection) return null;

    const filterQuery = { _id: id };
    const result = await this._usersCollection.replaceOne(filterQuery, user);
    return result.result.ok === 1 ? user : null;
  }

  // ***********************************************************
  // JOB LOGS **************************************************
  // ***********************************************************

  async getJobLogsByUserId(userId: ObjectId): Promise<JobLog[]> {
    if (!this._jobLogsCollection) return [];

    const filterQuery = { userId: userId };
    // sort by date desc, limit to only 100
    const sortQuery = { scheduledDate: -1 };
    return this._jobLogsCollection
      .find(filterQuery)
      .sort(sortQuery)
      .limit(100)
      .toArray();
  }

  async createJobLog(user: User, connection: Connection, type: string, scheduledDate: number): Promise<JobLog | null> {
    if (!this._jobLogsCollection) return null;

    const result = await this._jobLogsCollection.insertOne(JobLog.default(user, connection, type, scheduledDate));
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  // ***********************************************************
  // IMMEDIATE SYNC LOGS ***************************************
  // ***********************************************************

  async getImmediateSyncLogsByUserId(userId: ObjectId): Promise<ImmediateSyncLog[]> {
    if (!this._immediateSyncLogsCollection) return [];

    const filterQuery = { userId: userId };
    // sort by date desc, limit to only 100
    const sortQuery = { date: -1 };
    return this._immediateSyncLogsCollection
      .find(filterQuery)
      .sort(sortQuery)
      .limit(100)
      .toArray();
  }

  async createImmediateSyncLog(userId: ObjectId, newBalance: number, change: number, date: number, type: string, job: ObjectId | null, description: string): Promise<ImmediateSyncLog | null> {
    if (!this._immediateSyncLogsCollection) return null;

    const result = await this._immediateSyncLogsCollection.insertOne(ImmediateSyncLog.default(userId, newBalance, change, date, type, job, description));
    return result.result.ok === 1 ? result.ops[0] : null;
  }


  // ***********************************************************
  // MEMBERSHIP INFO *******************************************
  // ***********************************************************

  /**
   * Create membership info for user defined by user id
   * @param userId
   */
  async createMembershipInfo(userId: ObjectId): Promise<MembershipInfo | null> {
    if (!this._membershipInfoCollection) return null;

    const result = await this._membershipInfoCollection.insertOne(MembershipInfo.default(userId));
    return result.result.ok === 1 ? result.ops[0] : null;
  }

  async updateMembershipInfoStripeCustomerId(userId: ObjectId, stripeCustomerId: string): Promise<MembershipInfo | undefined | null> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { userId: userId };
    const result = await this._membershipInfoCollection.findOneAndUpdate(filterQuery, { $set: { stripeCustomerId: stripeCustomerId } }, { returnOriginal: false });

    return result.value;
  }

  async createMembershipInfoStripeSubscription(stripeCustomerId: string, stripeSubscriptionId: string, currentMembership: string, currentMembershipFinishes: number, currentConnections: number): Promise<MembershipInfo | undefined | null> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { stripeCustomerId: stripeCustomerId };
    const result = await this._membershipInfoCollection.findOneAndUpdate(filterQuery, {
      $set: {
        stripeSubscriptionId: stripeSubscriptionId,
        currentMembership: currentMembership,
        currentMembershipFinishes: currentMembershipFinishes,
        currentConnections: currentConnections,
      },
    }, { returnOriginal: false });

    return result.value;
  }

  /**
   * TODO return old membership info
   * @param stripeCustomerId
   * @param stripeSubscriptionId
   * @param currentMembership
   * @param currentMembershipFinishes
   * @param currentConnections
   */
  async updateMembershipInfoStripeSubscription(stripeCustomerId: string, stripeSubscriptionId: string, currentMembership: string, currentMembershipFinishes: number, currentConnections: number): Promise<MembershipInfo | undefined | null> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { stripeCustomerId: stripeCustomerId, stripeSubscriptionId: stripeSubscriptionId };
    const result = await this._membershipInfoCollection.findOneAndUpdate(filterQuery, {
      $set: {
        currentMembership: currentMembership,
        currentMembershipFinishes: currentMembershipFinishes,
        currentConnections: currentConnections,
      },
    });

    return result.value;
  }

  /**
   * TODO return old membership info
   * @param stripeCustomerId
   * @param stripeSubscriptionId
   */
  async deleteMembershipInfoStripeSubscription(stripeCustomerId: string, stripeSubscriptionId: string): Promise<MembershipInfo | undefined | null> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { stripeCustomerId: stripeCustomerId, stripeSubscriptionId: stripeSubscriptionId };
    const result = await this._membershipInfoCollection.findOneAndUpdate(filterQuery, {
      $set: {
        stripeSubscriptionId: null,
        currentMembership: null,
        currentMembershipFinishes: null,
        currentConnections: 0,
      },
    });

    return result.value;
  }

  /**
   * Get membership info for user defined by user id
   * @param userId
   */
  async getMembershipInfoByUserId(userId: ObjectId): Promise<MembershipInfo | null> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { userId: userId };
    return this._membershipInfoCollection.findOne(filterQuery);
  }

  /**
   * Use immediate sync for user defined by user id
   * findOneAndUpdate is atomic
   * @param userId
   */
  async useImmediateSync(userId: ObjectId): Promise<MembershipInfo | null | undefined> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { userId: userId, currentImmediateSyncs: { $gt: 0 } };
    const result = await this._membershipInfoCollection.findOneAndUpdate(filterQuery, { $inc: { currentImmediateSyncs: -1 } }, { returnOriginal: false });

    return result.value;
  }

  /**
   * Use immediate sync for user defined by user id
   * findOneAndUpdate is atomic
   * @param userId
   */
  async saveLastSubscriptionSession(userId: ObjectId, subscriptionSessionId: string): Promise<MembershipInfo | null | undefined> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { userId: userId };
    const result = await this._membershipInfoCollection.findOneAndUpdate(filterQuery, { $set: { stripeLastSubscriptionSessionId: subscriptionSessionId } }, { returnOriginal: false });

    return result.value;
  }

  /**
   * Add change number of immediate syncs for user defined by stripeCustomerId
   * findOneAndUpdate is atomic
   * @param stripeCustomerId
   * @param change
   */
  async addImmediateSync(stripeCustomerId: string, change: number): Promise<MembershipInfo | null | undefined> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { stripeCustomerId: stripeCustomerId };
    const result = await this._membershipInfoCollection.findOneAndUpdate(filterQuery, { $inc: { currentImmediateSyncs: change } }, { returnOriginal: false });

    return result.value;
  }

  async addActiveConnection(userId: ObjectId): Promise<boolean | null> {
    return await this.incrementActiveConnectionByAmount(userId, 1);
  }

  async removeActiveConnection(userId: ObjectId): Promise<boolean | null> {
    return await this.incrementActiveConnectionByAmount(userId, -1);
  }

  async incrementActiveConnectionByAmount(userId: ObjectId, amount: number): Promise<boolean | null> {
    if (!this._membershipInfoCollection) return null;

    const filterQuery = { userId: userId };
    const result = await this._membershipInfoCollection.findOneAndUpdate(filterQuery, { $inc: { currentActiveConnections: amount } });

    return result.value !== null;
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

    const filterQuery = {
      userId: userId,
    };
    return this._connectionsCollection.find(filterQuery).toArray();
  }

  async getActiveConnectionsByUserId(userId: ObjectId, limit: number): Promise<Connection[]> {
    if (!this._connectionsCollection) return [];

    const filterQuery = {
      userId: userId,
      isActive: true,
    };
    const sortQuery = { createdTimestamp: 1 };
    return this._connectionsCollection
      .find(filterQuery)
      .sort(sortQuery)
      .limit(limit)
      .toArray();
  }

  async deactivateConnection(connectionId: ObjectId): Promise<Connection | null | undefined> {
    if (!this._connectionsCollection) return null;

    const filterQuery = {
      _id: connectionId,
      isActive: true,
    };

    const result = await this._connectionsCollection.findOneAndUpdate(filterQuery, { $set: { isActive: false } });

    return result.value;

  }

  async getNotMarkedToDeleteConnectionsByUserId(userId: ObjectId): Promise<Connection[]> {
    if (!this._connectionsCollection) return [];

    const filterQuery = {
      userId: userId,
      deleteTimestamp: { $eq: null },
    };
    return this._connectionsCollection.find(filterQuery).toArray();
  }

  async getConnectionById(id: ObjectId): Promise<Connection | null> {
    if (!this._connectionsCollection) return null;

    const filterQuery = { _id: id };

    return this._connectionsCollection.findOne(filterQuery);
  }

  async getActiveConnectionById(id: ObjectId): Promise<Connection | null> {
    if (!this._connectionsCollection) return null;

    const filterQuery = {
      _id: id,
      deleteTimestamp: { $eq: null },
    };

    return this._connectionsCollection.findOne(filterQuery);
  }

  async updateConnectionById(id: ObjectId, connection: Connection): Promise<Connection | null> {
    if (!this._connectionsCollection) return null;

    const filterQuery = { _id: id };

    const result = await this._connectionsCollection.replaceOne(filterQuery, connection);
    return result.result.ok === 1 ? connection : null;
  }

  async updateConnectionSyncJobConfig(connection: Connection): Promise<Connection | null | undefined> {
    if (!this._connectionsCollection) return null;

    const filterQuery = { _id: connection._id };

    const result = await this._connectionsCollection.findOneAndUpdate(
      filterQuery,
      {
        $set: {
          configSyncJobDefinition: connection.configSyncJobDefinition,
          timeEntrySyncJobDefinition: connection.timeEntrySyncJobDefinition,
        },
      },
      { returnOriginal: false },
    );
    return result.value;

  }

  async deleteConnectionById(id: ObjectId): Promise<boolean> {
    if (!this._connectionsCollection) return false;

    const filterQuery = { _id: id };

    const result = await this._connectionsCollection.deleteOne(filterQuery);
    return result.result.ok === 1;
  }
}

export const databaseService = DatabaseService.Instance;