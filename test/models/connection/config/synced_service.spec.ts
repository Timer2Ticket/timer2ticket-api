import { expect } from 'chai';
import { ToolType } from '../../../../src/enums/tools/type_of_tool';
import { SyncedService } from '../../../../src/models/connection/config/synced_service';
import { ServiceConfig } from '../../../../src/models/connection/config/service_config';
import { DefaultTimeEntryActivity } from '../../../../src/models/connection/config/default_time_entry_activity';
import { Workspace } from '../../../../src/models/connection/config/workspace';

describe('SyncedService', () => {
  describe('with Redmine tool', () => {
    const redmineTool = {
      tool: ToolType.REDMINE.name,
      redmineApiKey: 'redmine-api-key',
      redmineApiPoint: 'redmine-api-point',
      selectedRedmineDefaultTimeEntryActivity: 1,
      selectedRedmineDefaultTimeEntryActivityName: 'Activity 1',
    };

    it('should create an instance with the provided Redmine tool', () => {
      const service = new SyncedService(redmineTool);
      expect(service.name).to.equal(ToolType.REDMINE.name);
      expect(service.config).to.be.instanceOf(ServiceConfig);
      expect(service.config.apiKey).to.equal('redmine-api-key');
      expect(service.config.apiPoint).to.equal('redmine-api-point');
      expect(service.config.defaultTimeEntryActivity).to.be.instanceOf(DefaultTimeEntryActivity);
      expect(service.config.defaultTimeEntryActivity?.id).to.equal(1);
      expect(service.config.defaultTimeEntryActivity?.name).to.equal('Activity 1');
      expect(service.config.workspace).to.be.undefined;
    });
  });

  describe('with Toggl Track tool', () => {
    const togglTrackTool = {
      tool: ToolType.TOGGL_TRACK.name,
      togglTrackApiKey: 'toggl-track-api-key',
      selectedTogglTrackWorkspace: 2,
      selectedTogglTrackWorkspaceName: 'Workspace 2',
    };

    it('should create an instance with the provided Toggl Track tool', () => {
      const service = new SyncedService(togglTrackTool);
      expect(service.name).to.equal(ToolType.TOGGL_TRACK.name);
      expect(service.config).to.be.instanceOf(ServiceConfig);
      expect(service.config.apiKey).to.equal('toggl-track-api-key');
      expect(service.config.apiPoint).to.be.undefined;
      expect(service.config.defaultTimeEntryActivity).to.be.undefined;
      expect(service.config.workspace).to.be.instanceOf(Workspace);
      expect(service.config.workspace?.id).to.equal(2);
      expect(service.config.workspace?.name).to.equal('Workspace 2');
    });
  });
});
