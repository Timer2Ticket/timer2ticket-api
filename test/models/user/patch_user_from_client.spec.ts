import { expect } from 'chai';
import { PatchUserFromClient } from '../../../src/models/user/from_client/patch_user_from_client';

describe('PatchUserFromClient', () => {
  it('should have correct values from constructor', () => {
    const obj = {
      syncProblemsInfo: true,
      timeZone: 'Europe/Prague',
      email: 'test@example.com',
    };
    const patchUser = new PatchUserFromClient(obj);
    expect(patchUser.syncProblemsInfo).to.be.true;
    expect(patchUser.timeZone).to.equal('Europe/Prague');
    expect(patchUser.email).to.equal('test@example.com');
  });

  it('should have correct values from constructor - null', () => {
    const obj = {
      syncProblemsInfo: null,
      timeZone: null,
      email: null,
    };
    const patchUser = new PatchUserFromClient(obj);

    expect(patchUser.syncProblemsInfo).to.be.null;
    expect(patchUser.timeZone).to.be.null;
    expect(patchUser.email).to.be.null;
  });
});
