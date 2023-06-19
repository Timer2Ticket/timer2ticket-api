import superagent from 'superagent';
import { Constants } from './constants';

export class CoreService {
  private static _instance: CoreService;

  public static get Instance(): CoreService {
    return this._instance || (this._instance = new this());
  }

  async createConnection(connectionId: string): Promise<superagent.Response | number> {
    let response: superagent.Response;
    try {
      response = await superagent
        .post(`${Constants.t2tCoreUrl}create/${connectionId}`);
    } catch (err) {
      return err.status;
    }
    return response;
  }

  async updateConnections(connectionIds: string[]): Promise<superagent.Response | number> {
    let response: superagent.Response;
    try {
      response = await superagent
        .post(`${Constants.t2tCoreUrl}update/`)
        .send({
          connectionIds: connectionIds,
        });
    } catch (err) {
      return err.status;
    }
    return response;
  }

  async syncConfigObjects(jobLogId: string): Promise<superagent.Response | number> {
    let response: superagent.Response;
    try {
      response = await superagent
        .post(`${Constants.t2tCoreUrl}schedule_config_job/${jobLogId}`);
    } catch (err) {
      return err.status;
    }
    return response;
  }

  async syncTimeEntries(jobLogId: string): Promise<superagent.Response | number> {
    let response: superagent.Response;
    try {
      response = await superagent
        .post(`${Constants.t2tCoreUrl}schedule_time_entries_job/${jobLogId}`);
    } catch (err) {
      return err.status;
    }
    return response;
  }
}

export const coreService = CoreService.Instance;