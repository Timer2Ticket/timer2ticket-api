import { expect } from 'chai';
import {
  SyncJobDefinitionFromClient
} from '../../../../src/models/connection/from_client/sync_job_definition_from_client';

describe('SyncJobDefinitionFromClient', () => {
  it('should create an instance with valid properties', () => {
    const obj = {
      everyHour: true,
      selectionOfDays: [0, 1, 2],
      syncTime: '12:30',
    };

    const syncJobDefinition = new SyncJobDefinitionFromClient(obj);

    expect(syncJobDefinition.everyHour).to.be.true;
    expect(syncJobDefinition.selectionOfDays).to.deep.equal([0, 1, 2]);
    expect(syncJobDefinition.syncTime).to.equal('12:30');
  });

  it('should return a valid cron string', () => {
    const obj = {
      everyHour: false,
      selectionOfDays: [0, 2, 4],
      syncTime: '09:15',
    };

    const syncJobDefinition = new SyncJobDefinitionFromClient(obj);
    const cronString = syncJobDefinition.getCronString();

    expect(cronString).to.equal('00 15 09 * * 1,3,5');
  });
});
