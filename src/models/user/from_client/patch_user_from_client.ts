import { IsBoolean, IsEmail, IsOptional } from 'class-validator';

export class PatchUserFromClient {
  @IsBoolean()
  @IsOptional()
  syncProblemsInfo!: boolean | null;

  @IsOptional()
  timeZone!: string | null;

  @IsEmail()
  @IsOptional()
  email!: string | null;

  // eslint-disable-next-line
  constructor(obj: any) {
    this.syncProblemsInfo = obj.syncProblemsInfo !== null  ? obj.syncProblemsInfo : null;
    this.timeZone = obj.timeZone !== null ? obj.timeZone : null;
    this.email = obj.email !== null ? obj.email : null;
  }
}