import { DefaultTimeEntryActivity } from './default_time_entry_activity';
import { Workspace } from './workspace';
import { ToolType } from '../../../enums/tools/type_of_tool';

export class ServiceConfig {
  /**
   * shared
   */
  userId!: number;

  apiKey!: string;

  // For Redmine
  defaultTimeEntryActivity!: DefaultTimeEntryActivity | null;
  // For Redmine
  apiPoint!: string | null;
  // For Toggl track
  workspace!: Workspace | null;

  // eslint-disable-next-line
  constructor(toolFromUser: any) {
    this.userId = toolFromUser.userId;

    if (toolFromUser.tool === ToolType.JIRA.name) {
      // TODO
    } else if (toolFromUser.tool === ToolType.REDMINE.name) {
      this.apiKey = toolFromUser.redmineApiKey;
      this.apiPoint = toolFromUser.redmineApiPoint;
      this.defaultTimeEntryActivity = new DefaultTimeEntryActivity(toolFromUser.selectedRedmineDefaultTimeEntryActivity, toolFromUser.selectedRedmineDefaultTimeEntryActivityName);
    } else if (toolFromUser.tool === ToolType.TOGGL_TRACK.name) {
      this.apiKey = toolFromUser.togglTrackApiKey;
      this.workspace = new Workspace(toolFromUser.selectedTogglTrackWorkspace, toolFromUser.selectedTogglTrackWorkspaceName);
    }
  }
}