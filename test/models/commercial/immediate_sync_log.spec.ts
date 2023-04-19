import { ObjectId } from 'mongodb';
import { expect } from 'chai';
import { ImmediateSyncLog } from '../../../src/models/commrecial/immediate_sync_log';

describe('ImmediateSyncLog', () => {
  let userId: ObjectId;
  let newBalance: number;
  let change: number;
  let date: number;
  let type: string;
  let jobLogId: ObjectId | null;
  let description: string;

  beforeEach(() => {
    userId = new ObjectId();
    newBalance = 100;
    change = -50;
    date = Date.now();
    type = 'USE_TIME_ENTRIES';
    jobLogId = new ObjectId();
    description = 'Used time entries for a task';
  });

  it('should create an instance of ImmediateSyncLog with default values', () => {
    const immediateSyncLog = ImmediateSyncLog.default(userId, newBalance, change, date, type, jobLogId, description);

    expect(immediateSyncLog).to.be.an.instanceOf(ImmediateSyncLog);
    expect(immediateSyncLog.userId).to.equal(userId);
    expect(immediateSyncLog.newBalance).to.equal(newBalance);
    expect(immediateSyncLog.change).to.equal(change);
    expect(immediateSyncLog.date).to.equal(date);
    expect(immediateSyncLog.type).to.equal(type);
    expect(immediateSyncLog.jobLogId).to.equal(jobLogId);
    expect(immediateSyncLog.description).to.equal(description);
  });
});
