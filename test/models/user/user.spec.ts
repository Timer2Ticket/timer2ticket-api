import { expect } from 'chai';
import { ObjectId } from 'mongodb';
import { NotificationSettings } from '../../../src/models/user/notification_settings';
import { User } from '../../../src/models/user/user';

describe('User', () => {
  let auth0UserId: string;
  let userMail: string | null;

  beforeEach(() => {
    auth0UserId = '123456789';
    userMail = 'test@example.com';
  });

  it('should create an instance of User with default values', () => {
    const user = User.default(auth0UserId, userMail);

    expect(user).to.be.an.instanceOf(User);
    expect(user.auth0UserId).to.equal(auth0UserId);
    expect(user.email).to.equal(userMail);
    expect(user.registratedDate).to.be.a('Date');
    expect(user.timeZone).to.equal('Europe/Prague');
    expect(user.notifiactionSettings).to.be.an.instanceOf(NotificationSettings);
    expect(user.connectionId).to.equal(1);
  });
});