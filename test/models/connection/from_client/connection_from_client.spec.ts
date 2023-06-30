import { expect } from 'chai';
import { ConnectionFromClient } from '../../../../src/models/connection/from_client/connection_from_client';
import { afterEach } from 'mocha';
import * as serviceConfigFunctions from '../../../../src/shared/services_config_functions';
import { getRedmineUserDetail, getTogglTrackUser } from '../../../../src/shared/services_config_functions';
import { ToolType } from '../../../../src/enums/tools/type_of_tool';


// eslint-disable-next-line @typescript-eslint/no-var-requires
const sinon = require('sinon');

describe('ConnectionFromClient', () => {
  describe('constructor', () => {
    it('should initialize properties correctly', () => {
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
          userId: 333,
          tool: ToolType.REDMINE.name,
          redmineApiKey: 'abc123',
          redmineApiPoint: 'https://redmine.example.com',
          selectedRedmineDefaultTimeEntryActivity: '123',
          selectedRedmineDefaultTimeEntryActivityName: 'Development',
        },
        secondTool: {
          userId: 333,
          tool: ToolType.TOGGL_TRACK.name,
          togglTrackApiKey: 'xyz456',
          selectedTogglTrackWorkspace: '456',
          selectedTogglTrackWorkspaceName: 'Workspace 1',
        },
      };

      const connectionFromClient = new ConnectionFromClient(obj);

      expect(connectionFromClient.configSyncJobDefinition.everyHour).to.be.true;
      expect(connectionFromClient.configSyncJobDefinition.selectionOfDays).to.deep.equal([0, 1, 2]);
      expect(connectionFromClient.configSyncJobDefinition.syncTime).to.equal('12:30');

      expect(connectionFromClient.timeEntrySyncJobDefinition.everyHour).to.be.false;
      expect(connectionFromClient.timeEntrySyncJobDefinition.selectionOfDays).to.deep.equal([3, 4]);
      expect(connectionFromClient.timeEntrySyncJobDefinition.syncTime).to.equal('09:15');

      expect(connectionFromClient.firstTool.tool).to.equal(ToolType.REDMINE.name);
      expect(connectionFromClient.firstTool.redmineApiKey).to.equal('abc123');
      expect(connectionFromClient.firstTool.redmineApiPoint).to.equal('https://redmine.example.com/');
      expect(connectionFromClient.firstTool.selectedRedmineDefaultTimeEntryActivity).to.equal('123');
      expect(connectionFromClient.firstTool.selectedRedmineDefaultTimeEntryActivityName).to.equal('Development');

      expect(connectionFromClient.secondTool.tool).to.equal(ToolType.TOGGL_TRACK.name);
      expect(connectionFromClient.secondTool.togglTrackApiKey).to.equal('xyz456');
      expect(connectionFromClient.secondTool.selectedTogglTrackWorkspace).to.equal('456');
      expect(connectionFromClient.secondTool.selectedTogglTrackWorkspaceName).to.equal('Workspace 1');
    });
  });

  describe('validateConnectionTools', () => {
    beforeEach(() => {
      sinon.stub(serviceConfigFunctions, 'getRedmineTimeEntryActivities').resolves(
        {
          body: {
            time_entry_activities: [
              { id: '123', name: 'Development' },
              { id: '456', name: 'Testing' },
            ],
          },
        });
      sinon.stub(serviceConfigFunctions, 'getTogglTrackWorkspaces').resolves(
        {
          body: [
            { id: '456', name: 'Workspace 1' },
            { id: '789', name: 'Workspace 2' },
          ],
        },
      );
      sinon.stub(serviceConfigFunctions, 'getTogglTrackUser').resolves(
        {
          body: {
            id: 333,
          },
        },
      );
      sinon.stub(serviceConfigFunctions, 'getRedmineUserDetail').resolves(
        {
          body: {
            user: {
              id: 333,
            },
          },
        },
      );
    });
    afterEach(() => {
      sinon.restore();
    });
    it('should return true for valid connection tools', async () => {
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
          userId: 333,
          tool: ToolType.REDMINE.name,
          redmineApiKey: 'abc123',
          redmineApiPoint: 'https://redmine.example.com',
          selectedRedmineDefaultTimeEntryActivity: '123',
          selectedRedmineDefaultTimeEntryActivityName: 'Development',
        },
        secondTool: {
          userId: 333,
          tool: ToolType.TOGGL_TRACK.name,
          togglTrackApiKey: 'xyz456',
          selectedTogglTrackWorkspace: '456',
          selectedTogglTrackWorkspaceName: 'Workspace 1',
        },
      };

      const connectionFromClient = new ConnectionFromClient(obj);

      const errors: string[] = [];
      const isValid = await connectionFromClient.validateConnectionTools(errors);

      expect(isValid).to.be.true;
      expect(errors).to.be.empty;
    });

    it('should return false and populate errors for invalid connection tools', async () => {
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
          tool: 'redmine', // Same tool as firstTool, should be invalid
          redmineApiKey: 'def456',
          redmineApiPoint: 'https://redmine.example.com',
          selectedRedmineDefaultTimeEntryActivity: '456',
          selectedRedmineDefaultTimeEntryActivityName: 'Design',
        },
      };

      const connectionFromClient = new ConnectionFromClient(obj);

      const errors: string[] = [];
      const isValid = await connectionFromClient.validateConnectionTools(errors);

      expect(isValid).to.be.false;
      expect(errors).to.deep.equal(['Both tools are the same']);
    });
  });
});
