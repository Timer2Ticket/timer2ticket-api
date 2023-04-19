import { ObjectId } from 'mongodb';

export class ImmediateSyncLog {
  // Mongo
  _id!: ObjectId;

  // UserId
  userId!: ObjectId;

  newBalance!: number;
  change!: number;
  date!: number;
  // type: 'USE_TIME_ENTRIES' | 'USE_CONFIG' | 'BUY'
  type!: string;
  // link to job if type is 'USE'
  jobLogId!: ObjectId | null;
  description!: string;

  static default(userId: ObjectId, newBalance: number, change: number, date: number, type: string, jobLogId: ObjectId | null, description: string): ImmediateSyncLog {
    const immediateSyncLog = new ImmediateSyncLog();
    immediateSyncLog.userId = userId;
    immediateSyncLog.newBalance = newBalance;
    immediateSyncLog.change = change;
    immediateSyncLog.date = date;
    immediateSyncLog.type = type;
    immediateSyncLog.jobLogId = jobLogId;
    immediateSyncLog.description = description;
    return immediateSyncLog;
  }
}
