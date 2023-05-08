import { ServiceConfig } from './service_config';

export class SyncedService {

  name!: string;
  config!: ServiceConfig;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  constructor(toolFromUser: any) {
    this.name = toolFromUser.tool;
    this.config = new ServiceConfig(toolFromUser);
  }
}