import { IsArray, IsBoolean, IsNumber, IsString, Matches, Max, Min } from 'class-validator';

export class SyncJobDefinitionFromClient {
  @IsBoolean()
  everyHour!: boolean;

  @IsArray()
  @IsNumber({},{each: true})
  @Min(0, { each: true })
  @Max(6, { each: true })
  // monday = 0, sunday = 6
  selectionOfDays!: number[];

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
  syncTime!: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
  constructor(obj: any) {
    this.everyHour = obj.everyHour;
    this.selectionOfDays = obj.selectionOfDays;
    this.syncTime = obj.syncTime;
  }

  getCronString(): string {
    const seconds = '00';
    const minutes = this.syncTime.split(':')[1];
    const hours = this.everyHour ? '*' : this.syncTime.split(':')[0];
    const dayOfMonth = '*';
    const months = '*';
    // map to sunday = 0, saturday = 6
    const daysOfWeek = this.selectionOfDays.map(day => day === 6 ? 0 : day + 1).join(',');

    return `${seconds} ${minutes} ${hours} ${dayOfMonth} ${months} ${daysOfWeek}`;
  }
}