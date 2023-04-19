import { expect } from 'chai';
import { ObjectId } from 'mongodb';
import { MembershipInfo } from '../../../src/models/commrecial/membership_info';

describe('MembershipInfo', () => {
  it('should create an instance with default values', () => {
    const userId = new ObjectId();
    const membershipInfo = MembershipInfo.default(userId);

    expect(membershipInfo.userId).to.equal(userId);
    expect(membershipInfo.stripeCustomerId).to.be.null;
    expect(membershipInfo.stripeSubscriptionId).to.be.null;
    expect(membershipInfo.currentMembership).to.be.null;
    expect(membershipInfo.currentMembershipFinishes).to.be.null;
    expect(membershipInfo.currentConnections).to.equal(0);
    expect(membershipInfo.currentActiveConnections).to.equal(0);
    expect(membershipInfo.currentImmediateSyncs).to.equal(0);
  });
});
