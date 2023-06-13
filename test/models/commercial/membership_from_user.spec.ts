import { expect } from 'chai';
import { MembershipFromClient } from '../../../src/models/commrecial/from_client/membership_from_client';

describe('MembershipFromUser', () => {
  it('should create an instance with the provided name and connectionsOver', () => {
    const membership = new MembershipFromClient({
      name: 'Hobby',
      connectionsOver: 5
    });

    expect(membership.name).to.equal('Hobby');
    expect(membership.connectionsOver).to.equal(5);
  });
});
