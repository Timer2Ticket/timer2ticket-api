import { SyncJobDefinitionFromClient } from '../from_client/sync_job_definition_from_client';

export class SyncJobDefinition {
  schedule!: string;
  lastSuccessfullyDone!: number | null;

  everyHour!: boolean;
  selectionOfDays!: number[];
  syncTime!: string;


  constructor(syncJobDefinitionFromClient: SyncJobDefinitionFromClient) {
    this.schedule = syncJobDefinitionFromClient.getCronString();
    this.lastSuccessfullyDone = null;

    this.everyHour = syncJobDefinitionFromClient.everyHour;
    this.selectionOfDays = syncJobDefinitionFromClient.selectionOfDays;
    this.syncTime = syncJobDefinitionFromClient.syncTime;
  }
}