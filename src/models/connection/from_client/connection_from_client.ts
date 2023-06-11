import { IsObject, ValidateNested } from 'class-validator';
import superagent from 'superagent';
import { ToolType } from '../../../enums/tools/type_of_tool';
import { getRedmineTimeEntryActivities, getTogglTrackWorkspaces } from '../../../shared/services_config_functions';
import { SyncJobDefinitionFromClient } from './sync_job_definition_from_client';

export class ConnectionFromClient {
  @ValidateNested()
  configSyncJobDefinition!: SyncJobDefinitionFromClient;

  @ValidateNested()
  timeEntrySyncJobDefinition!: SyncJobDefinitionFromClient;

  @IsObject()
    // eslint-disable-next-line
  firstTool!: any;

  @IsObject()
    // eslint-disable-next-line
  secondTool!: any;

  // eslint-disable-next-line
  constructor(obj: any) {
    this.configSyncJobDefinition = new SyncJobDefinitionFromClient(obj.configSyncJobDefinition);
    this.timeEntrySyncJobDefinition = new SyncJobDefinitionFromClient(obj.timeEntrySyncJobDefinition);
    this.firstTool = obj.firstTool;
    this.secondTool = obj.secondTool;
  }

  async validateConnectionTools(errors: string[]): Promise<boolean> {
    let result = true;

    if(this.firstTool.tool == this.secondTool.tool) {
      errors.push('Both tools are the same');
      return false;
    }

    if (!await this.validateFirstTool(errors)) {
      result = false;
    }
    if (!await this.validateSecondTool(errors)) {
      result = false;
    }

    return result;
  }

  private async validateFirstTool(errors: string[]): Promise<boolean> {
    return await this.validateTool(this.firstTool, 'First tool', errors);
  }

  private async validateSecondTool(errors: string[]): Promise<boolean> {
    return await this.validateTool(this.secondTool, 'Second tool', errors);
  }

  // eslint-disable-next-line
  private async validateTool(tool: any, errorPrefix: string, errors: string[]): Promise<boolean> {
    // eslint-disable-next-line no-prototype-builtins
    if (!tool.hasOwnProperty('tool')) {
      errors.push(`${errorPrefix} is missing tool property`);
      return false;
    }

    if (tool.tool === ToolType.REDMINE.name) {
      return await this.validateRedmine(tool, 'Second tool', errors);
    } else if (tool.tool === ToolType.JIRA.name) {
      return await this.validateJira(tool, 'Second tool', errors);
    } else if (tool.tool === ToolType.TOGGL_TRACK.name) {
      return await this.validateTogglTrack(tool, 'Second tool', errors);
    } else {
      errors.push(`${errorPrefix} has invalid tool property`);
      return false;
    }
  }

  // eslint-disable-next-line
  private async validateRedmine(tool: any, errorPrefix: string, errors: string[]): Promise<boolean> {
    ToolType.REDMINE.attributesFromClient.forEach((attribute) => {
        if (!tool[attribute]) {
          errors.push(`${errorPrefix} is missing ${attribute}`);
          return false;
        }
      },
    );
    const redmineApiKey: string = tool.redmineApiKey;
    const redmineApiPoint: string = tool.redmineApiPoint;
    const selectedRedmineDefaultTimeEntryActivity: string = tool.selectedRedmineDefaultTimeEntryActivity;
    const selectedRedmineDefaultTimeEntryActivityName: string = tool.selectedRedmineDefaultTimeEntryActivityName;

    const responseTimeEntryActivities: superagent.Response | number = await getRedmineTimeEntryActivities(redmineApiPoint, redmineApiKey);
    if (typeof responseTimeEntryActivities === 'number') {
      errors.push(`Invalid redmine api key or api point.`);
      return false;
    }

    let foundRedmineDefaultTimeEntryActivity = null;
    // eslint-disable-next-line
    responseTimeEntryActivities.body.time_entry_activities.forEach((timeEntryActivity: any) => {
        if (timeEntryActivity.id === selectedRedmineDefaultTimeEntryActivity && timeEntryActivity.name === selectedRedmineDefaultTimeEntryActivityName) {
          foundRedmineDefaultTimeEntryActivity = timeEntryActivity;
        }
      },
    );

    if (!foundRedmineDefaultTimeEntryActivity) {
      errors.push(`Invalid redmine default time entry activity.`);
      return false;
    }

    return true;
  }

  // eslint-disable-next-line
  private async validateJira(tool: any, errorPrefix: string, errors: string[]): Promise<boolean> {
    // TODO Implement
    return true;
  }

  // eslint-disable-next-line
  private async validateTogglTrack(tool: any, errorPrefix: string, errors: string[]): Promise<boolean> {
    ToolType.TOGGL_TRACK.attributesFromClient.forEach((attribute) => {
        if (!tool[attribute]) {
          errors.push(`${errorPrefix} is missing ${attribute}`);
          return false;
        }
      },
    );
    const togglTrackApiKey: string = tool.togglTrackApiKey;
    const selectedTogglTrackWorkspace: string = tool.selectedTogglTrackWorkspace;
    const selectedTogglTrackWorkspaceName: string = tool.selectedTogglTrackWorkspaceName;

    const responseWorkspaces: superagent.Response | number = await getTogglTrackWorkspaces(togglTrackApiKey);
    if (typeof responseWorkspaces === 'number') {
      errors.push(`Invalid toggl track api key.`);
      return false;
    }

    let foundTogglTrackWorkspace = null;
    // eslint-disable-next-line
    responseWorkspaces.body.forEach((workspace: any) => {
        if (workspace.id === selectedTogglTrackWorkspace && workspace.name === selectedTogglTrackWorkspaceName) {
          foundTogglTrackWorkspace = workspace;
        }
      },
    );

    if (!foundTogglTrackWorkspace) {
      errors.push(`Invalid toggl track workspace.`);
      return false;
    }

    return true;
  }
}