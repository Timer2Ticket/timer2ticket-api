import * as chai from 'chai';
import superagent from 'superagent';
import { UserAuthentication } from '../src/models/user_authentication';
import { UserRegistration } from '../src/models/user_registration';
import { UserToClient } from '../src/models/user_to_client';
import { databaseServiceMock } from './shared/database_service.mock';
import { TestConstants } from './shared/test_constants';

chai.should();

//$env:DB_NAME='timer2ticketDB-test' ; pm run start-test

describe('Jobs tests.', () => {

  let _authenticatedUser: UserToClient;

  before(async () => {
    await databaseServiceMock.init();

    // registrate user for testing
    await superagent
      .post(`${TestConstants.apiUrl}registration`)
      .send(new UserRegistration('test@test.test', 'password123', 'password123'));

    const response = await superagent
      .post(`${TestConstants.apiUrl}authentication`)
      .send(new UserAuthentication('test@test.test', 'password123'));

    _authenticatedUser = response?.body;
  });

  after(async () => {
    // wipe data after all tests are finished
    await databaseServiceMock.wipeAllData();
    databaseServiceMock.close();
  });

  describe('Jobs', () => {
    it('should not pass when provided with no auth token', async () => {

      const response = await superagent
        .post(`${TestConstants.apiUrl}jobs/scheduled/${_authenticatedUser._id}`)
        .ok(() => {
          // do not throw exception if status >= 300
          return true;
        });

      response.status.should.equal(403);
    });

    it('should not pass when provided with wrong token', async () => {

      const response = await superagent
        .post(`${TestConstants.apiUrl}jobs/scheduled/${_authenticatedUser._id}`)
        .set('x-access-token', 'empty')
        .ok(() => {
          // do not throw exception if status >= 300
          return true;
        });

      response.status.should.equal(401);
    });

    it('should not pass when provided with wrong user id', async () => {
      const wrongUserId = 'wronguserid';

      const response = await superagent
        .post(`${TestConstants.apiUrl}jobs/scheduled/${wrongUserId}`)
        .set('x-access-token', _authenticatedUser.token)
        .ok(() => {
          // do not throw exception if status >= 300
          return true;
        });

      response.status.should.equal(404);
    });

    it('should pass authentication and authorization when provided with valid data', async () => {
      const response = await superagent
        .post(`${TestConstants.apiUrl}jobs/scheduled/${_authenticatedUser._id}`)
        .set('x-access-token', _authenticatedUser.token)
        .ok(() => {
          // do not throw exception if status >= 300
          return true;
        });

      // server still responds with error since CORE is not available
      response.status.should.equal(503);
    });
  });
});