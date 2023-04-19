import { expect } from 'chai';
import { ToolType } from '../../../../src/enums/tools/type_of_tool';
import { ServiceConfig } from '../../../../src/models/connection/config/service_config';
import { DefaultTimeEntryActivity } from '../../../../src/models/connection/config/default_time_entry_activity';
import { Workspace } from '../../../../src/models/connection/config/workspace';

describe('ServiceConfig', () => {
  describe('with Redmine tool', () => {
    const redmineTool = {
      tool: ToolType.REDMINE.name,
      redmineApiKey: 'redmine-api-key',
      redmineApiPoint: 'redmine-api-point',
      selectedRedmineDefaultTimeEntryActivity: 1,
      selectedRedmineDefaultTimeEntryActivityName: 'Activity 1',
    };

    it('should create an instance with the provided Redmine tool', () => {
      const config = new ServiceConfig(redmineTool);
      expect(config.apiKey).to.equal('redmine-api-key');
      expect(config.apiPoint).to.equal('redmine-api-point');
      expect(config.defaultTimeEntryActivity).to.be.instanceOf(DefaultTimeEntryActivity);
      expect(config.defaultTimeEntryActivity?.id).to.equal(1);
      expect(config.defaultTimeEntryActivity?.name).to.equal('Activity 1');
      expect(config.workspace).to.be.undefined;
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
      const config = new ServiceConfig(togglTrackTool);
      expect(config.apiKey).to.equal('toggl-track-api-key');
      expect(config.apiPoint).to.be.undefined;
      expect(config.defaultTimeEntryActivity).to.be.undefined;
      expect(config.workspace).to.be.instanceOf(Workspace);
      expect(config.workspace?.id).to.equal(2);
      expect(config.workspace?.name).to.equal('Workspace 2');
    });
  });
});