import { ObjectId } from "mongodb";
import { JobDefinition } from "./job_definition";
import { ServiceDefinition } from "./service_definition/service_definition";
import { User } from "./user";

export class UserToClient {
  _id: string | ObjectId;
  username: string;
  registrated: Date;
  status: string;
  configSyncJobDefinition: JobDefinition | null;
  timeEntrySyncJobDefinition: JobDefinition | null;
  serviceDefinitions: ServiceDefinition[];

  token: string;

  constructor(user: User, token: string) {
    this._id = user._id;
    this.username = user.username;
    this.registrated = user.registrated;
    this.status = user.status;
    this.configSyncJobDefinition = user.configSyncJobDefinition;
    this.timeEntrySyncJobDefinition = user.timeEntrySyncJobDefinition;
    this.serviceDefinitions = user.serviceDefinitions;

    this.token = token;
  }
}