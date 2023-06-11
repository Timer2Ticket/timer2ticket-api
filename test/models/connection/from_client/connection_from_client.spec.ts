import { expect } from 'chai';
import {
  SyncJobDefinitionFromClient
} from '../../../../src/models/connection/from_client/sync_job_definition_from_client';
import { ConnectionFromClient } from '../../../../src/models/connection/from_client/connection_from_client';

describe('ConnectionFromClient', () => {

  const obj = {
    configSyncJobDefinition: {
      everyHour: true,
      selectionOfDays: [0, 1, 2],
      syncTime: '12:30',
    },
    timeEntrySyncJobDefinition: {
      everyHour: false,
      selectionOfDays: [3, 4],
      syncTime: '09:15',
    },
    firstTool: {
      tool: 'redmine',
      redmineApiKey: 'abc123',
      redmineApiPoint: 'https://redmine.example.com',
      selectedRedmineDefaultTimeEntryActivity: '123',
      selectedRedmineDefaultTimeEntryActivityName: 'Development',
    },
    secondTool: {
      tool: 'toggl_track',
      togglTrackApiKey: 'xyz456',
      selectedTogglTrackWorkspace: '456',
      selectedTogglTrackWorkspaceName: 'Workspace 1',
    },
  };

  it('should create an instance with valid properties', () => {
    const connection = new ConnectionFromClient(obj);

    expect(connection.configSyncJobDefinition).to.be.an.instanceOf(SyncJobDefinitionFromClient);
    expect(connection.timeEntrySyncJobDefinition).to.be.an.instanceOf(SyncJobDefinitionFromClient);
    expect(connection.firstTool).to.deep.equal(obj.firstTool);
    expect(connection.secondTool).to.deep.equal(obj.secondTool);
  });

  it('should return true when validating connection tools with valid tools', async () => {
    const connection = new ConnectionFromClient(obj);
    const errors: string[] = [];
    const result = await connection.validateConnectionTools(errors);

    expect(result).to.be.true;
    expect(errors).to.be.an('array').that.is.empty;
  });

  it('should return false and populate errors when validating connection tools with same tools', async () => {
    const connection = new ConnectionFromClient(obj);
    const errors: string[] = [];
    const result = await connection.validateConnectionTools(errors);

    expect(result).to.be.false;
    expect(errors).to.be.an('array').that.includes('Both tools are the same');
  });

  // Add more test cases for other validation scenarios
});
