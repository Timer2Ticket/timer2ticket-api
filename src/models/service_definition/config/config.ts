import { IsOptional, IsUrl, IsDefined, IsNumber } from 'class-validator';

export class Config {
  /**
   * shared
   */
  @IsDefined()
  @IsNumber()
  userId!: number;
  /**
   * below Toggl specific
   */
  workspace?: Workspace | null;
  /**
   * below Redmine specific
   */
  @IsOptional()
  @IsUrl()
  apiPoint?: string | null;

  defaultTimeEntryActivity?: DefaultTimeEntryActivity | null;
}

class Workspace {
  id!: string | number;
  name!: string;
}

class DefaultTimeEntryActivity {
  id!: string | number;
  name!: string;
}