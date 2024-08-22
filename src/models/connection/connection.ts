import { ObjectId } from 'mongodb';
import { SyncJobDefinition } from './config/sync_job_definition';
import { SyncedService } from './config/synced_service';
import { ConnectionFromClient } from './from_client/connection_from_client';
import { ProjectMapping } from './from_client/project_mapping';

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
  deletionTimestamp!: number | null;
  createdTimestamp!: number;
  mappings!: any[];
  projectMappings!: ProjectMapping[]

  constructor(userId: ObjectId, userConnectionId: number, connectionFromClient: ConnectionFromClient, isActive: boolean) {
    this.userId = userId;
    this.userConnectionId = userConnectionId;

    this.configSyncJobDefinition = new SyncJobDefinition(connectionFromClient.configSyncJobDefinition);
    this.timeEntrySyncJobDefinition = new SyncJobDefinition(connectionFromClient.timeEntrySyncJobDefinition);
    this.firstService = new SyncedService(connectionFromClient.firstTool);
    this.secondService = new SyncedService(connectionFromClient.secondTool);

    this.isActive = isActive;
    this.deletionTimestamp = null;
    this.createdTimestamp = Math.floor(Date.now());
    this.mappings = [];
    this.projectMappings = []
    connectionFromClient.projectMappings.forEach((m: any) => {
      this.projectMappings.push(new ProjectMapping(m.idFirstService, m.idSecondService))
    })
  }

  static getConnectionBetweenString(connection: Connection): string {
    return `${SyncedService.getSyncServiceName(connection.firstService)} - ${SyncedService.getSyncServiceName(connection.secondService)}`;
  }
}