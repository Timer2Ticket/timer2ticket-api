import { ObjectId } from 'mongodb';
import { anyid } from 'anyid';

export class TtlToken {
  _id!: string | ObjectId;
  username: string;
  token: string;
  createdAt: Date;

  constructor(username: string) {
    this.username = username;
    this.token = anyid().encode('Aa0').length(24).random().id();
    this.createdAt = new Date();
  }
}