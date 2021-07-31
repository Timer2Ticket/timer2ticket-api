import * as chai from 'chai';
import request from 'superagent';
import superagent from 'superagent';
import { UserAuthentication } from '../src/models/user_authentication';
import { UserRegistration } from '../src/models/user_registration';
import { databaseServiceMock } from './shared/database_service.mock';
import { TestConstants } from './shared/test_constants';

chai.should();

//$env:DB_NAME='timer2ticketDB-test' ; pm run start-test

describe('Authentication tests.', () => {

  before(async () => {
    await databaseServiceMock.init();

    // registrate user for testing
    await superagent
      .post(`${TestConstants.apiUrl}registration`)
      .send(new UserRegistration('test@test.test', 'password123', 'password123'));
  });

  after(async () => {
    // wipe data after all tests are finished
    await databaseServiceMock.wipeAllData();
    databaseServiceMock.close();
  });

  async function _sendAuthenticationRequest(userToAuthenticate: UserAuthentication): Promise<request.Response> {
    return superagent
      .post(`${TestConstants.apiUrl}authentication`)
      .send(userToAuthenticate)
      .ok(() => {
        // do not throw exception if status >= 300
        return true;
      });
  }

  describe('Authentication', () => {
    it('should authenticate user when provided with valid data', async () => {
      const userToAuthenticate: UserAuthentication
        = new UserAuthentication('test@test.test', 'password123');

      const response = await _sendAuthenticationRequest(userToAuthenticate);
      response.status.should.equal(200);
    });

    it('should not authenticate user when provided with invalid data #1 (wrong username format)', async () => {
      const userToAuthenticate: UserAuthentication
        = new UserAuthentication('not email', 'password123');

      const response = await _sendAuthenticationRequest(userToAuthenticate);
      response.status.should.equal(400);
    });

    it('should not authenticate user when provided with invalid data #2 (user with this username does not exist)', async () => {
      const userToAuthenticate: UserAuthentication
        = new UserAuthentication('another@test.test', 'password123');

      const response = await _sendAuthenticationRequest(userToAuthenticate);
      response.status.should.equal(404);
    });

    it('should not authenticate user when provided with invalid data #3 (bad password)', async () => {
      const userToAuthenticate: UserAuthentication
        = new UserAuthentication('test@test.test', 'Xpassword123');

      const response = await _sendAuthenticationRequest(userToAuthenticate);
      response.status.should.equal(401);
    });
  });
});