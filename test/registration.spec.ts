import * as chai from 'chai';
import request from 'superagent';
import superagent from 'superagent';
import { UserRegistration } from '../src/models/user_registration';
import { databaseServiceMock } from './shared/database_service.mock';
import { TestConstants } from './shared/test_constants';

chai.should();

//$env:DB_NAME='timer2ticketDB-test' ; pm run start-test

describe('Registration tests.', () => {

  before(async () => {
    await databaseServiceMock.init();
  });

  after(() => {
    databaseServiceMock.close();
  });

  afterEach(async () => {
    // wipe data after each test
    await databaseServiceMock.wipeAllData();
  });

  async function _sendRegistrationRequest(userToRegistrate: UserRegistration): Promise<request.Response> {
    return superagent
      .post(`${TestConstants.apiUrl}registration`)
      .send(userToRegistrate)
      .ok(() => {
        // do not throw exception if status >= 300
        return true;
      });
  }

  describe('Registration', () => {
    it('should registrate new person when provided with valid data', async () => {
      const userToRegistrate: UserRegistration
        = new UserRegistration('test@test.test', 'password123', 'password123');

      const response = await _sendRegistrationRequest(userToRegistrate);
      response.status.should.equal(204);
    });

    it('should not registrate new person when provided with invalid data #1 (wrong username)', async () => {
      const userToRegistrate: UserRegistration
        = new UserRegistration('not email', 'password123', 'password123');

      const response = await _sendRegistrationRequest(userToRegistrate);
      response.status.should.equal(400);
    });

    it('should not registrate new person when provided with invalid data #2 (weak passwords)', async () => {
      const userToRegistrate: UserRegistration
        = new UserRegistration('test@test.test', 'pass1', 'pass1');

      const response = await _sendRegistrationRequest(userToRegistrate);
      response.status.should.equal(400);
    });

    it('should not registrate new person when provided with invalid data #3 (not same passwords)', async () => {
      const userToRegistrate: UserRegistration
        = new UserRegistration('test@test.test', 'Xpassword123', 'Ypassword123');

      const response = await _sendRegistrationRequest(userToRegistrate);
      response.status.should.equal(400);
    });

    it('should not registrate new person when provided with invalid data #4 (user with same username exists)', async () => {
      const userToRegistrate: UserRegistration
        = new UserRegistration('test@test.test', 'password123', 'password123');

      const responseOk = await _sendRegistrationRequest(userToRegistrate);
      responseOk.status.should.equal(204, 'Could not registrate first user to test another one.');

      const responseWrong = await _sendRegistrationRequest(userToRegistrate);
      responseWrong.status.should.equal(409);
    });
  });
});