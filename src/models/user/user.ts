import { ObjectId } from 'mongodb';
import { NotificationSettings } from './notification_settings';

export class User {
  // Mongo
  _id!: ObjectId;

  // Auth0
  auth0UserId!: string;


  // User info
  email!: string | null;
  registratedDate!: number;
  timeZone!: string;
  notifiactionSettings!: NotificationSettings;

  // Connection user id
  connectionId!: number;

  static default(auth0UserId: string, userMail: string | null): User {
    const user = new User();
    user.auth0UserId = auth0UserId;
    user.email = userMail;
    user.registratedDate = Math.floor(Date.now() / 1000);
    user.timeZone = 'Europe/Prague';
    user.notifiactionSettings = new NotificationSettings();
    user.connectionId = 1;
    return user;
  }
}
