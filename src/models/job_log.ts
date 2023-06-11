import { ObjectId } from 'mongodb';
import { User } from './user/user';
import { Connection } from './connection/connection';

export class JobLog {
  // Mongo
  _id!: ObjectId;

  // UserId
  userId!: ObjectId;
  connectionId!: ObjectId;
  userConnectionId!: number;

  connectionBetween!: string;

  // type: 'config' | 'time-entries'
  type!: string;
  // origin: 't2t-auto' | 'manual'
  origin!: string;
  // status: 'scheduled' | 'running' | 'successful' | 'unsuccessful'
  status!: string;
  scheduledDate!: number;
  started!: number | null;
  completed!: number | null;
  // currently not used
  errors: [] = [];

  static default(user: User, connection: Connection, type: string, scheduledDate: number): JobLog {
    const jobLog = new JobLog();
    jobLog.userId = user._id;
    jobLog.connectionId = connection._id;
    jobLog.userConnectionId = connection.userConnectionId;
    jobLog.connectionBetween = Connection.getConnectionBetweenString(connection);
    jobLog.type = type;
    jobLog.origin = 'manual';
    jobLog.status = 'scheduled';
    jobLog.scheduledDate = scheduledDate;
    jobLog.started = null;
    jobLog.completed = null;
    jobLog.errors = [];
    return jobLog;
  }
}