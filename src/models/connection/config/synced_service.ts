import { ServiceConfig } from './service_config';
import { ToolType } from '../../../enums/tools/type_of_tool';

export class SyncedService {

  // Service name: Toggl Track, Redmine, Jira
  name!: string;
  config!: ServiceConfig;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  constructor(toolFromUser: any) {
    this.name = toolFromUser.tool;
    this.config = new ServiceConfig(toolFromUser);
  }

  static getSyncServiceName(syncedService: SyncedService): string {
    if (syncedService.name === ToolType.TOGGL_TRACK.name) {
      return syncedService.config.workspace!.name;
    } else if (syncedService.name === ToolType.REDMINE.name) {
      return syncedService.config.apiPoint!;
    } else if (syncedService.name === ToolType.JIRA.name) {
      return syncedService.config.domain!;
    } else {
      throw new Error('Unknown sync service name');
    }
  }
}