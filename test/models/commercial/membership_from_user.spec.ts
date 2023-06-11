import { expect } from 'chai';
import { MembershipFromUser } from '../../../src/models/commrecial/membership_from_user';

describe('MembershipFromUser', () => {
  it('should create an instance with the provided name and connectionsOver', () => {
    const membership = new MembershipFromUser();
    membership.name = 'Hobby';
    membership.connectionsOver = 5;

    expect(membership.name).to.equal('Hobby');
    expect(membership.connectionsOver).to.equal(5);
  });
});
