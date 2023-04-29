import { ObjectId } from 'mongodb';
import { NotificationSettings } from './notification_settings';
import { MembershipInfo } from '../membership/membership_info';

export class User {
  // Mongo
  _id!: string | ObjectId;

  // Auth0
  auth0UserId!: string;


  // User info
  email!: string | null;
  registratedDate!: Date;
  timeZone!: string;
  notifiactionSettings!: NotificationSettings;

  // Membership

  membershipInfo!: MembershipInfo;

  static default(auth0UserId: string): User {
    const user = new User();
    user.auth0UserId = auth0UserId;
    user.email = null;
    user.registratedDate = new Date();
    user.timeZone = ''; // TODO set default timezone
    user.notifiactionSettings = new NotificationSettings();
    user.membershipInfo = new MembershipInfo();
    return user;
  }
}