import { expect } from 'chai';
import { SyncJobDefinition } from '../../../../src/models/connection/config/sync_job_definition';
import {
  SyncJobDefinitionFromClient,
} from '../../../../src/models/connection/from_client/sync_job_definition_from_client';

describe('SyncJobDefinition', () => {
  const syncJobDefinitionFromClient: SyncJobDefinitionFromClient = new SyncJobDefinitionFromClient({
    everyHour: false,
    selectionOfDays: [1, 2, 3],
    syncTime: '10:00',
  });

  it('should create an instance with the provided SyncJobDefinitionFromClient', () => {
    const jobDefinition = new SyncJobDefinition(syncJobDefinitionFromClient);
    expect(jobDefinition.schedule).to.equal('00 00 10 * * 2,3,4');
    expect(jobDefinition.lastJobTime).to.be.null;
    expect(jobDefinition.status).to.be.null;
    expect(jobDefinition.everyHour).to.be.false;
    expect(jobDefinition.selectionOfDays).to.deep.equal([1, 2, 3]);
    expect(jobDefinition.syncTime).to.equal('10:00');
  });
});