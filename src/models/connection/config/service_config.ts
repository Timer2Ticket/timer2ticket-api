import { DefaultTimeEntryActivity } from './default_time_entry_activity';
import { Workspace } from './workspace';
import { ToolType } from '../../../enums/tools/type_of_tool';
import { FallbackIssue } from './fallback_issue';
import { IssueType } from './issue_type';

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

  //FOr Jira
  userEmail!: string | null
  //For Jira
  domain!: string | null
  //for Jira
  fallbackIssue!: FallbackIssue | null

  //for Jira an later redmine
  ignoredIssueTypes!: IssueType[]

  // eslint-disable-next-line
  constructor(toolFromUser: any) {
    this.userId = toolFromUser.userId;

    if (toolFromUser.tool === ToolType.JIRA.name) {
      this.apiKey = toolFromUser.jiraApiKey
      this.domain = toolFromUser.jiraDomain
      this.userEmail = toolFromUser.jiraUserEmail
      this.fallbackIssue = new FallbackIssue(toolFromUser.jiraFallbackIssue, toolFromUser.jiraFallbackIssueName)
      this.ignoredIssueTypes = []
      if (toolFromUser.ignoredIssueTypes)
        toolFromUser.ignoredIssueTypes.forEach((o: IssueType) => {
          this.ignoredIssueTypes.push(new IssueType(o.id, o.name))
        })
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