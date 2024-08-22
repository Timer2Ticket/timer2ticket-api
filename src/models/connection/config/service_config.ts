import { DefaultTimeEntryActivity } from './default_time_entry_activity';
import { Workspace } from './workspace';
import { ToolType } from '../../../enums/tools/type_of_tool';
import { FallbackIssue } from './fallback_issue';
import { IssueState } from './issue_state';
import { CustomField } from './custom_field';

export class ServiceConfig {
  /**
   * shared
   */
  userId!: number | string;

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

  //for Jira and later redmine
  ignoredIssueStates!: IssueState[] | null

  //for pairing of two projects, for Jira and Redmine Only
  customField!: CustomField | null

  // eslint-disable-next-line
  constructor(toolFromUser: any) {
    this.userId = toolFromUser.userId;

    switch (toolFromUser.tool) {
      case ToolType.JIRA.name: {
        this.apiKey = toolFromUser.jiraApiKey
        this.domain = toolFromUser.jiraDomain
        this.userEmail = toolFromUser.jiraUserEmail
        this.fallbackIssue = new FallbackIssue(toolFromUser.jiraFallbackIssue, toolFromUser.jiraFallbackIssueName)
        this.ignoredIssueStates = []
        if (toolFromUser.ignoredIssueStates)
          toolFromUser.ignoredIssueStates.forEach((o: IssueState) => {
            this.ignoredIssueStates!.push(new IssueState(o.id, o.name))
          })
        this.customField = toolFromUser.customField ? new CustomField(toolFromUser.customField.id, toolFromUser.customField.name) : null
      }
      case ToolType.REDMINE.name: {
        this.apiKey = toolFromUser.redmineApiKey;
        this.apiPoint = toolFromUser.redmineApiPoint;
        this.defaultTimeEntryActivity = new DefaultTimeEntryActivity(toolFromUser.selectedRedmineDefaultTimeEntryActivity, toolFromUser.selectedRedmineDefaultTimeEntryActivityName);
        this.customField = toolFromUser.customField ? new CustomField(toolFromUser.customField.id, toolFromUser.customField.name) : null
      }
      case ToolType.TOGGL_TRACK.name: {
        this.apiKey = toolFromUser.togglTrackApiKey;
        this.workspace = new Workspace(toolFromUser.selectedTogglTrackWorkspace, toolFromUser.selectedTogglTrackWorkspaceName);
      }
    }
  }
}