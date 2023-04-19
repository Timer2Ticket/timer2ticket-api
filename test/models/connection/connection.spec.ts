import { expect } from 'chai';
import { ObjectId } from 'mongodb';
import { ConnectionFromClient } from '../../../src/models/connection/from_client/connection_from_client';
import { SyncJobDefinition } from '../../../src/models/connection/config/sync_job_definition';
import { Connection } from '../../../src/models/connection/connection';
import { SyncedService } from '../../../src/models/connection/config/synced_service';
import { ToolType } from '../../../src/enums/tools/type_of_tool';

describe('Connection', () => {
  let userId: ObjectId;
  let userConnectionId: number;
  let connectionFromClient: ConnectionFromClient;
  let isActive: boolean;
  let connection: Connection;

  beforeEach(() => {
    userId = new ObjectId();
    userConnectionId = 1;
    connectionFromClient = new ConnectionFromClient({
      configSyncJobDefinition: {
        everyHour: true,
        selectionOfDays: [1, 3, 5],
        syncTime: '08:00'
      },
      timeEntrySyncJobDefinition: {
        everyHour: false,
        selectionOfDays: [2, 4, 6],
        syncTime: '14:30'
      },
      firstTool: {
        userId: "asdf",
        tool: ToolType.TOGGL_TRACK.name,
        togglTrackApiKey: 'api-key',
        selectedTogglTrackWorkspace: 'workspace-id',
        selectedTogglTrackWorkspaceName: 'Workspace A',
      },
      secondTool: {
        userId: "asdf",
        tool: ToolType.REDMINE.name,
        redmineApiKey: 'api-key',
        redmineApiPoint: 'https://redmine.example.com',
        selectedRedmineDefaultTimeEntryActivity: 333,
        selectedRedmineDefaultTimeEntryActivityName: 'TestName',
      }
    });
    isActive = true;

    connection = new Connection(userId, userConnectionId, connectionFromClient, isActive);
  });

  it('should create an instance of Connection with default values', () => {
    expect(connection).to.be.an.instanceOf(Connection);
    expect(connection.userId).to.equal(userId);
    expect(connection.userConnectionId).to.equal(userConnectionId);

    expect(connection.configSyncJobDefinition.schedule).to.equal('00 00 * * * 2,4,6');
    expect(connection.configSyncJobDefinition.lastJobTime).to.equal(null);
    expect(connection.configSyncJobDefinition.status).to.equal(null);
    expect(connection.configSyncJobDefinition.everyHour).to.equal(true);
    expect(connection.configSyncJobDefinition.selectionOfDays).to.deep.equal([1, 3, 5]);
    expect(connection.configSyncJobDefinition.syncTime).to.equal('08:00');

    expect(connection.timeEntrySyncJobDefinition.schedule).to.equal('00 30 14 * * 3,5,0');
    expect(connection.timeEntrySyncJobDefinition.lastJobTime).to.equal(null);
    expect(connection.timeEntrySyncJobDefinition.status).to.equal(null);
    expect(connection.timeEntrySyncJobDefinition.everyHour).to.equal(false);
    expect(connection.timeEntrySyncJobDefinition.selectionOfDays).to.deep.equal([2, 4, 6]);
    expect(connection.timeEntrySyncJobDefinition.syncTime).to.equal('14:30');

    expect(connection.firstService.name).to.equal(ToolType.TOGGL_TRACK.name);
    expect(connection.firstService.config.userId).to.equal('asdf');
    expect(connection.firstService.config.apiKey).to.equal('api-key');
    expect(connection.firstService.config.workspace!.id).to.equal('workspace-id');
    expect(connection.firstService.config.workspace!.name).to.equal('Workspace A');

    expect(connection.secondService.name).to.equal(ToolType.REDMINE.name);
    expect(connection.secondService.config.userId).to.equal('asdf');
    expect(connection.secondService.config.apiKey).to.equal('api-key');
    expect(connection.secondService.config.apiPoint).to.equal('https://redmine.example.com/');
    expect(connection.secondService.config.defaultTimeEntryActivity!.id).to.equal(333);
    expect(connection.secondService.config.defaultTimeEntryActivity!.name).to.equal('TestName');

    expect(connection.isActive).to.equal(isActive);
    expect(connection.deleteTimestamp).to.be.null;
    expect(connection.createdTimestamp).to.be.a('number');
    expect(connection.mappings).to.be.an('array');
  });

  it('should return the connection string between two services', () => {
    const connectionStr = Connection.getConnectionBetweenString(connection);

    expect(connectionStr).to.equal('Workspace A - https://redmine.example.com/');
  });
});
