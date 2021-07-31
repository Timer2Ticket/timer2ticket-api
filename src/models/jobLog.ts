import { ObjectId } from "mongodb";

export class JobLog {
  _id!: string | ObjectId;
  userId!: string | ObjectId;
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
}