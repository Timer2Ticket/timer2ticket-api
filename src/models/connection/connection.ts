import { ObjectId } from 'mongodb';
import { SyncJobDefinition } from './config/sync_job_definition';
import { SyncedService } from './config/synced_service';
import { ConnectionFromClient } from './from_client/connection_from_client';

export class Connection {
  // Mongo
  _id!: ObjectId;

  // user connnection id
  userConnectionId!: number;

  // Link to user
  userId!: ObjectId;

  // Connection info
  configSyncJobDefinition!: SyncJobDefinition;
  timeEntrySyncJobDefinition!: SyncJobDefinition;
  firstService!: SyncedService;
  secondService!: SyncedService;
  isActive!: boolean;

  constructor(userId: ObjectId, userConnectionId: number, connectionFromClient: ConnectionFromClient) {
    this.userId = userId;
    this.userConnectionId = userConnectionId;

    this.configSyncJobDefinition = new SyncJobDefinition(connectionFromClient.configSyncJobDefinition);
    this.timeEntrySyncJobDefinition = new SyncJobDefinition(connectionFromClient.timeEntrySyncJobDefinition);

    this.firstService = new SyncedService(connectionFromClient.firstTool);
    this.secondService = new SyncedService(connectionFromClient.secondTool);

    // TODO: check if user with his membership has access to this service
    this.isActive = true;
  }
}