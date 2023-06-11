import { ServiceConfig } from './service_config';

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
    if(syncedService.name === 'Toggl Track') {
      return syncedService.config.workspace!.name;
    } else if (syncedService.name === 'Redmine') {
      return syncedService.config.apiPoint!;
    } else if (syncedService.name === 'Jira') {
      throw new Error('Not implemented');
    } else {
      throw new Error('Unknown sync service name');
    }
  }
}