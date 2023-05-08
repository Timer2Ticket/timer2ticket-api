import { ObjectId } from 'mongodb';

export class Membership {
  // Mongo
  _id!: ObjectId;

  // Name
  name!: string;

  // Parameters
  maxActiveConnections!: number;
  // syncFrequency: 'Hourly' | 'Daily' | 'Weekly'
  syncFrequency!: string;
  price!: number;
  // status: 'Active' | 'Inactive'
  status!: string;
}