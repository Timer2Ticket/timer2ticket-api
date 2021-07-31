import { IsOptional, IsInt, } from 'class-validator';

export class JobDefinition {
  /**
   * Cron schedule format
   */
  // is validated in users PUT method with cron.validate
  @IsOptional()
  schedule!: string;

  /**
   * Date (in number) indicating when this job was last successfully done
   */
  @IsOptional()
  @IsInt()
  lastSuccessfullyDone!: number | null;
}