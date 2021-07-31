import { IsIn, ValidateNested, IsDefined, IsBoolean, IsOptional, } from 'class-validator';
import { Config } from "./config/config";

/**
 * This class contains definitions that are same for all services
 * Service dependent definitions are stored in config
 */
export class ServiceDefinition {
  @IsIn(['Redmine', 'TogglTrack'])
  name!: string;

  @IsDefined()
  apiKey!: string;

  @IsBoolean()
  isPrimary!: boolean;

  @IsOptional()
  @ValidateNested()
  config!: Config;
}