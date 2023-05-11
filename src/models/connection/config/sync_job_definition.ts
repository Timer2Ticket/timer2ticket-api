import { SyncJobDefinitionFromClient } from '../from_client/sync_job_definition_from_client';

export class SyncJobDefinition {
  schedule!: string;
  lastJobTime!: number | null;
  // lastJobStatus: 'SUCCESS' | 'ERROR' | 'IN_PROGRESS' | null;
  status!: string | null;

  everyHour!: boolean;
  selectionOfDays!: number[];
  syncTime!: string;


  constructor(syncJobDefinitionFromClient: SyncJobDefinitionFromClient) {
    this.schedule = syncJobDefinitionFromClient.getCronString();
    this.lastJobTime = null;
    this.status = null;

    this.everyHour = syncJobDefinitionFromClient.everyHour;
    this.selectionOfDays = syncJobDefinitionFromClient.selectionOfDays;
    this.syncTime = syncJobDefinitionFromClient.syncTime;
  }
}