import { IsEmail, IsDate, IsMongoId, IsIn, IsOptional, ValidateNested, } from 'class-validator';
import { ObjectId } from "mongodb";
import { JobDefinition } from "./job_definition";
import { ServiceDefinition } from "./service_definition/service_definition";
import { User } from "./user";

export class UserFromClient {
  @IsMongoId()
  _id: string | ObjectId;

  @IsEmail()
  username: string;

  @IsDate()
  registrated: Date;

  @IsIn(['active', 'inactive', 'registrated'])
  status: string;

  @IsOptional()
  @ValidateNested()
  configSyncJobDefinition: JobDefinition | null;

  @IsOptional()
  @ValidateNested()
  timeEntrySyncJobDefinition: JobDefinition | null;

  @ValidateNested({ each: true })
  serviceDefinitions: ServiceDefinition[];

  // is already validated before method is called by JWT mechanism
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